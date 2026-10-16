// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License

import path from "node:path";
import fs from "node:fs/promises";
import ts from "typescript";
import { findWarpConfig } from "@microsoft/warp";
import { resolveProject } from "../../util/resolveProject.ts";
import { format } from "../../util/prettier.ts";
import { createPrinter } from "../../util/printer.ts";
import { leafCommand, makeCommandInfo } from "../../framework/command.ts";

/*
 * This command initializes a newly generated modular SDK, not an arbitrary handwritten package.
 * Preconditions: committed generated-only src/, no source symlinks, named .ts public exports,
 * and static ESM relative imports that stay within src/ except for the package's package.json.
 * The modular emitter and repository survey support these source-shape assumptions.
 * Git cleanliness and generated-only ownership are caller responsibilities, not inferred here.
 *
 * Git is the recovery mechanism: installation errors can leave a partially migrated package.
 * Restore its committed files and remove newly created migration files before retrying.
 * We still repair private test imports, aliases, metadata, and missing compiler roots:
 * the repository survey found real packages that need each of those changes.
 */
const log = createPrinter("customization-init");
// New public barrels are handwritten files, so give them the repository's source header.
const licenseHeader =
  "// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\n\n";
// The generated implementation uses .ts plus occasional .mts platform variants.
const sourceExtensions = /\.m?ts$/;
// Avoid dependencies and derived output when looking for authored references outside src/.
const ignoredDirectories = new Set(["node_modules", ".git", "temp", "review"]);

// Plan external writes before changing source; Git supplies their recovery copies.
interface FileUpdate {
  path: string;
  updated: string;
}

export const commandInfo = makeCommandInfo(
  "init",
  "moves generated source to src/generated and preserves public entry points",
  {},
);

/**
 * Resolves the package from the CLI's working directory and translates errors into CLI failure.
 * Keeping this boundary separate lets tests and other callers use an explicit package directory.
 */
export default leafCommand(commandInfo, async () => {
  try {
    const info = await resolveProject(process.cwd());
    return await initializeCustomization(info.path);
  } catch (error) {
    log("❌ Could not initialize customization:", (error as Error).message);
    log(
      "If files changed, restore the package from Git and remove new migration files before retrying.",
    );
    return false;
  }
});

/**
 * Moves generated source beneath src/generated while retaining public source entry points.
 * It plans source/configuration edits before moving files, but does not implement rollback.
 * Public package exports and Warp mappings stay unchanged because outer barrels keep their paths.
 *
 * Repeated initialization is an error: existing layouts need a deliberate manual migration.
 * Shared compiler configurations are left untouched when they already include every public root.
 */
export async function initializeCustomization(packageDirectory: string): Promise<boolean> {
  // Normalize once so file identities and containment checks use absolute lexical paths.
  packageDirectory = path.resolve(packageDirectory);
  const srcDirectory = path.join(packageDirectory, "src");
  const generatedDirectory = path.join(srcDirectory, "generated");
  // Refuse both legacy baselines and already separated source before reading or moving files.
  // There is no reliable automatic way to infer existing handwritten customizations.
  if (
    (await exists(path.join(packageDirectory, "generated"))) ||
    (await exists(generatedDirectory))
  ) {
    throw new Error(
      "generated/ or src/generated already exists. This command only initializes newly generated packages.",
    );
  }

  const manifestPath = path.join(packageDirectory, "package.json");
  const originalManifest = await fs.readFile(manifestPath, "utf8");
  // JSON is untrusted input at runtime; narrow its shape before assigning manifest properties.
  const manifest: unknown = JSON.parse(originalManifest);
  if (!isRecord(manifest)) throw new Error("package.json must contain an object.");
  // Warp supplies source entry points; package.json exports usually point to compiled files.
  // Inferring source paths from dist paths would couple the migration to output conventions.
  const resolved = await findWarpConfig(packageDirectory);
  if (!resolved) {
    throw new Error("A Warp configuration is required to locate modular SDK entry points.");
  }

  // Several subpaths can map to the same source file; create only one barrel per source path.
  const entryPoints = new Set<string>();
  for (const [subpath, source] of Object.entries(resolved.config.exports)) {
    // Warp already rejects wildcard export keys; each source mapping must name one file.
    const sourcePath = path.resolve(packageDirectory, source);
    // Exports outside src/, such as ./package.json, do not move or need source barrels.
    if (!isWithin(srcDirectory, sourcePath)) continue;
    // Exported TS files have a predictable runtime extension for the new ESM forwarding import.
    if (!source.endsWith(".ts") || source.includes("*")) {
      throw new Error(`Expected a TypeScript source entry point for ${subpath}: ${source}`);
    }
    await fs.access(sourcePath); // Reject missing mapped files before moving any source.
    entryPoints.add(sourcePath);
  }
  // Keep the conventional index.ts entry point as a supported-layout requirement.
  if (!entryPoints.has(path.join(srcDirectory, "index.ts"))) {
    throw new Error("The package root must export src/index.ts in its Warp configuration.");
  }
  // Cross-check the conventional subpath map so an advertised export cannot be overlooked.
  // This is not general validation of every possible package.json exports shorthand.
  if (isRecord(manifest.exports)) {
    for (const subpath of Object.keys(manifest.exports).filter((key) => key.startsWith("."))) {
      if (!(subpath in resolved.config.exports)) {
        throw new Error(`Public export has no Warp source mapping: ${subpath}`);
      }
    }
  }

  // All source moves together, including platform variants and non-script assets.
  const sourceFiles = await listFiles(srcDirectory);
  /**
   * Maps an old source destination to its new location without changing its relative subtree.
   * Destinations outside src/ stay fixed so a moved import can adjust its relative distance.
   * Simplify if: every source reference stays within src/; those imports need no rewriting.
   */
  const moveTarget = (target: string): string =>
    isWithin(srcDirectory, target)
      ? path.join(generatedDirectory, path.relative(srcDirectory, target))
      : target;
  /**
   * Recognizes source and runtime spellings of a public target.
   * Existing callers outside src/ must keep reaching the public barrel, not bypass customization.
   * Generated ESM imports use explicit .js filenames; no extensionless resolution is necessary.
   */
  const isPublicTarget = (target: string): boolean =>
    [...entryPoints].some((entry) => target === entry || target === entry.replace(/\.ts$/, ".js"));
  /**
   * Moves private targets for callers that stay outside the relocated source tree.
   * Unlike generated-to-generated references, public references must retain the outer barrel.
   * Simplify if: those callers import public entry points only; their imports need no edits.
   */
  const moveInternalTarget = (target: string): string =>
    isPublicTarget(target) ? target : moveTarget(target);

  // Store only changed source text; moving the original tree preserves every other byte.
  const generatedUpdates = new Map<string, string>();
  const barrels = new Map<string, string>();
  for (const file of sourceFiles) {
    if (!sourceExtensions.test(file)) continue;
    const content = await fs.readFile(file, "utf8");
    const relocated = moveTarget(file);
    // Inside generated source, references to other moved files follow their generated copies.
    // References to fixed package files, e.g. ../package.json, gain another ../ segment.
    const updated = rewriteModuleReferences(content, file, relocated, moveTarget);
    if (updated !== content) generatedUpdates.set(path.relative(srcDirectory, file), updated);
    if (entryPoints.has(file)) {
      const target = relativeSpecifier(file, relocated.replace(/\.ts$/, ".js"));
      // Documentation tools inspect the outer entry point. Keep its leading package-doc block
      // instead of replacing the entire header with only a license and export statements.
      const packageDocs = (ts.getLeadingCommentRanges(content, 0) ?? [])
        .map(({ pos, end }) => content.slice(pos, end))
        .filter((comment) => comment.includes("@packageDocumentation"))
        .join("\n");
      // Preserve each public source path; JSON quoting also escapes the import string safely.
      barrels.set(
        path.relative(srcDirectory, file),
        `${licenseHeader}${packageDocs ? `${packageDocs}\n\n` : ""}export * from ${JSON.stringify(target)};\n`,
      );
    }
  }

  // Public export destinations remain unchanged; only private source references move.
  // imports can nest platform conditions and arrays, so visit string values at every depth.
  // Simplify if: private aliases have a fixed, known structure or authors update them manually.
  if (manifest.imports !== undefined) {
    manifest.imports = mapStrings(manifest.imports, (value) =>
      relocatePackagePath(value, packageDirectory, srcDirectory, moveTarget),
    );
  }
  // Version tooling follows these source paths. Without relocation, the next bump can miss
  // the generated user-agent/version constant even though the migrated package builds.
  const metadata = manifest["//metadata"];
  if (isRecord(metadata) && Array.isArray(metadata.constantPaths)) {
    for (const entry of metadata.constantPaths) {
      if (isRecord(entry) && typeof entry.path === "string") {
        entry.path = relocatePackagePath(entry.path, packageDirectory, srcDirectory, moveTarget);
      }
    }
  }
  // npm run --if-present customize already handles an absent script. Do not add or change one.

  const externalUpdates: FileUpdate[] = [];
  // Tests, helpers, and compiler configs can refer directly to old private source locations.
  // Skip src/ because it has its own relocation pass, and skip dependency/build output trees.
  // Simplify if: a package template enumerates these files or forbids direct private imports.
  for (const file of await listFiles(packageDirectory, new Set(["src"]), true)) {
    if (file === manifestPath) continue;
    // Limit configuration rewriting to recognized JSONC files, not arbitrary JSON or YAML.
    const isConfig = /(?:^|[/\\])(?:tsconfig[^/\\]*|api-extractor)\.json$/.test(file);
    if (!sourceExtensions.test(file) && !isConfig) continue;
    const original = await fs.readFile(file, "utf8");
    const updated = isConfig
      ? rewriteConfigReferences(original, file, srcDirectory, moveTarget, moveInternalTarget)
      : rewriteModuleReferences(original, file, file, moveInternalTarget);
    if (updated !== original) externalUpdates.push({ path: file, updated });
  }
  // The root barrel now imports generated barrels, not the other public barrels.
  // Explicit roots ensure that every published subpath is still emitted.
  // 95 surveyed modular packages have public barrels missing from their explicit compiler roots.
  for (const configPath of new Set(
    // Multiple output targets may share one config; plan its compiler-root change only once.
    resolved.config.targets.map((target) => path.resolve(packageDirectory, target.tsconfig)),
  )) {
    // Warp parses shared ${configDir}-based configs through a virtual package-local extends.
    // App Configuration and AI Agents use this layout; recursive includes need no mutation.
    if (!isWithin(packageDirectory, configPath)) {
      const parsed = ts.parseJsonConfigFileContent(
        { extends: configPath },
        ts.sys,
        packageDirectory,
        undefined,
        path.join(packageDirectory, "__customization_init__.json"),
      );
      if (
        parsed.errors.length === 0 &&
        [...entryPoints].every((entry) => parsed.fileNames.includes(entry))
      ) {
        continue;
      }
      throw new Error(`Compiler configuration requires manual localization: ${configPath}`);
    }
    // Compose compiler-root changes with any path edits already planned for this config.
    const planned = externalUpdates.find((update) => update.path === configPath);
    const original = planned?.updated ?? (await fs.readFile(configPath, "utf8"));
    const updated = await addCompilerEntryPoints(
      planned?.updated ?? original,
      configPath,
      entryPoints,
    );
    if (planned) planned.updated = updated;
    else if (updated !== original) externalUpdates.push({ path: configPath, updated });
  }
  // Format before installation so parsing/formatting failures cannot leave source half-moved.
  const updatedManifest = await format(JSON.stringify(manifest, null, 2), "json-stringify");
  externalUpdates.push({
    path: manifestPath,
    updated: updatedManifest,
  });

  // Capture the original entries before creating generated/, so it never moves into itself.
  // Git provides recovery if any rename/write fails; do not build a second backup transaction.
  const entries = await fs.readdir(srcDirectory);
  await fs.mkdir(generatedDirectory);
  for (const entry of entries) {
    await fs.rename(path.join(srcDirectory, entry), path.join(generatedDirectory, entry));
  }
  for (const [relative, content] of generatedUpdates) {
    await fs.writeFile(path.join(generatedDirectory, relative), content);
  }
  for (const [relative, content] of barrels) {
    const file = path.join(srcDirectory, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
  }
  for (const update of externalUpdates) await fs.writeFile(update.path, update.updated);
  log(`✅ Moved source to src/generated and preserved ${barrels.size} public entry points.`);
  return true;
}

/**
 * Tests path-entry existence without following symlinks, including dangling symlinks.
 * Only ENOENT means absent; permission or I/O errors must stop the migration.
 * Simplify if: a helper with these exact error and symlink semantics already exists.
 */
async function exists(file: string): Promise<boolean> {
  try {
    await fs.lstat(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

/**
 * Enumerates ordinary files without following symlinks.
 * Source enumeration includes assets; the external pass skips known dependency/build trees.
 * Source symlinks are outside the supported new-package contract.
 */
async function listFiles(
  directory: string,
  additionalIgnores = new Set<string>(),
  skipBuildArtifacts = false,
): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    // Additional ignores apply at this traversal level (e.g. package-root src/); artifact
    // ignores apply at every level when scanning authored files outside the moved source.
    if (
      additionalIgnores.has(entry.name) ||
      (skipBuildArtifacts &&
        (ignoredDirectories.has(entry.name) || /^dist(?:-|$)/.test(entry.name))) // Covers dist and dist-* output layouts.
    ) {
      continue;
    }
    const file = path.join(directory, entry.name);
    // Do not propagate root-only ignores into nested directories with the same name.
    if (entry.isDirectory()) result.push(...(await listFiles(file, new Set(), skipBuildArtifacts)));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}

/**
 * Checks lexical containment, including the directory itself, without filesystem resolution.
 * A string prefix would wrongly include siblings such as src-other.
 * This is not a security boundary: it does not resolve symlinks in ancestor directories.
 * Simplify if: callers only handle paths from a known relative template, without containment
 * decisions. Keep validation for arbitrary manifest/configuration paths.
 */
function isWithin(directory: string, target: string): boolean {
  const relative = path.relative(directory, target);
  // Parent segments escape the subtree; an absolute relative result can indicate another drive.
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/**
 * Creates a relative module specifier from the importing file to an absolute destination.
 * Slashes and a leading ./ keep it a relative import on every supported host platform.
 * Simplify if: imports and entry points occupy one fixed layout with known relative distances;
 * nested public subpaths currently need this calculation.
 */
function relativeSpecifier(from: string, to: string): string {
  const relative = path.relative(path.dirname(from), to).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

/**
 * Rewrites static ESM imports/re-exports after moving the importer, its target, or both.
 * Syntax inspection avoids changing unrelated strings; text edits avoid reprinting whole files.
 * The target mapper distinguishes generated-to-generated references from external callers.
 * The supported emitter uses named ESM exports and no path-based dynamic imports, require,
 * import.meta.url assets, or triple-slash references. The survey found no need to handle those.
 * Relative package.json imports still need rebasing; package-name self-imports stay unchanged.
 */
function rewriteModuleReferences(
  content: string,
  oldFile: string,
  newFile: string,
  moveTarget: (target: string) => string,
): string {
  const sourceFile = ts.createSourceFile(oldFile, content, ts.ScriptTarget.Latest, true);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  /**
   * Resolves one relative spelling against its old importer, then rebases the mapped target.
   * Bare package names and aliases use separate resolution rules and remain unchanged here.
   * Simplify if: the importer and every destination always move by the same relative offset.
   */
  const rewrite = (specifier: string): string => {
    if (!specifier.startsWith(".")) return specifier;
    const target = path.resolve(path.dirname(oldFile), specifier);
    const relocated = moveTarget(target);
    // If both ends move together, leave the original spelling and quoting byte-for-byte.
    // Example: src/client.ts -> ./models.js still works inside src/generated/.
    if (
      path.relative(path.dirname(oldFile), target) ===
      path.relative(path.dirname(newFile), relocated)
    ) {
      return specifier;
    }
    return relativeSpecifier(newFile, relocated);
  };
  // Only declaration module specifiers are paths here; ordinary strings are never rewritten.
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      const updated = rewrite(specifier.text);
      if (updated !== specifier.text) {
        edits.push({
          start: specifier.getStart(sourceFile),
          end: specifier.end,
          text: JSON.stringify(updated),
        });
      }
    }
  }
  return applyEdits(content, edits);
}

/**
 * Adjusts supported path-like JSONC values without discarding comments or unrelated settings.
 * It keeps public aliases and broad src/ roots, but moves private paths and $internal aliases.
 * This is a lexical path heuristic, not a full tsconfig inheritance/baseUrl resolver.
 * Simplify if: template-owned aliases are the only private paths, or authors update configs
 * explicitly. Then fixed property updates replace this general string visitor.
 */
function rewriteConfigReferences(
  content: string,
  file: string,
  srcDirectory: string,
  moveTarget: (target: string) => string,
  moveInternalTarget: (target: string) => string,
): string {
  // Validate JSONC before inspecting its syntax; JSON.parse would reject comments/trailing commas.
  const parsed = ts.parseConfigFileTextToJson(file, content);
  if (parsed.error) {
    throw new Error(`${file}: ${ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")}`);
  }
  // Parse again as syntax so replacements can retain the original comments and property layout.
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JSON,
  );
  const edits: Array<{ start: number; end: number; text: string }> = [];
  /**
   * Rewrites relative-looking string values, never property names, in recognized config files.
   * Ancestor inspection detects arrays nested beneath an $internal path mapping.
   * Simplify if: a fixed schema identifies each path field and its owning directory.
   */
  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteral(node) &&
      !(ts.isPropertyAssignment(node.parent) && node.parent.name === node) &&
      (node.text.startsWith(".") || node.text.startsWith("src/"))
    ) {
      const target = path.resolve(path.dirname(file), node.text);
      let internalAlias = false;
      // $internal mappings deliberately bypass public barrels, even for an index.ts target.
      for (let parent: ts.Node | undefined = node.parent; parent; parent = parent.parent) {
        if (
          ts.isPropertyAssignment(parent) &&
          ts.isStringLiteral(parent.name) &&
          parent.name.text.startsWith("$internal")
        ) {
          internalAlias = true;
        }
      }
      // Preserve src/, src/*, and src/**/* roots so outer handwritten files stay in the project.
      // A narrower subtree or explicit private file must follow the generated implementation.
      const prefix = target.split("*")[0].replace(/[/\\]$/, "");
      let relocated = target;
      if (
        isWithin(srcDirectory, target) &&
        (internalAlias || (target !== srcDirectory && prefix !== srcDirectory))
      ) {
        // Ordinary public aliases retain the outer barrel; $internal aliases always move.
        relocated = internalAlias ? moveTarget(target) : moveInternalTarget(target);
      }
      // Older browser tests resolve private imports from built output, not source. Their
      // $internal aliases must follow dist/<condition>/generated/ while public aliases stay put.
      const distDirectory = path.join(path.dirname(srcDirectory), "dist");
      if (internalAlias && isWithin(distDirectory, target)) {
        const [condition, ...rest] = path.relative(distDirectory, target).split(path.sep);
        if (condition && rest.length) {
          relocated = path.join(distDirectory, condition, "generated", ...rest);
        }
      }
      if (relocated !== target) {
        edits.push({
          start: node.getStart(sourceFile),
          end: node.end,
          text: JSON.stringify(relativeSpecifier(file, relocated)),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return applyEdits(content, edits);
}

/**
 * Adds missing public source roots without rewriting configs that already include every barrel.
 * The current emitter lists every export in include; older packages sometimes only list index.ts.
 * Syntax edits retain JSONC comments; final formatting normalizes the modified config.
 * Simplify if: every target already includes all public barrels recursively and none are
 * excluded. If preserving JSONC comments is unnecessary, object serialization is simpler.
 */
async function addCompilerEntryPoints(
  content: string,
  configPath: string,
  entryPoints: Set<string>,
): Promise<string> {
  const parsed = ts.parseConfigFileTextToJson(configPath, content);
  const config: unknown = parsed.config;
  if (parsed.error || !isRecord(config)) {
    throw new Error(`Expected a valid compiler configuration object: ${configPath}`);
  }
  // Use TypeScript's resolved root list, not a guess about a glob or inherited include.
  // After relocation, each public barrel keeps the same path, so existing roots remain valid.
  const resolved = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath));
  if (
    resolved.errors.length === 0 &&
    [...entryPoints].every((entry) => resolved.fileNames.includes(entry))
  ) {
    return content;
  }
  // Missing files is valid; an existing non-array value is not safe to append to.
  const configured = config.files;
  if (
    configured !== undefined &&
    (!Array.isArray(configured) || configured.some((file) => typeof file !== "string"))
  ) {
    throw new Error(`Compiler files must be an array of paths: ${configPath}`);
  }
  const files: string[] = configured === undefined ? [] : configured;
  // Compare absolute identities so ../src/index.ts and ./../src/index.ts are not duplicated.
  const paths = new Set(files.map((file) => path.resolve(path.dirname(configPath), file)));
  const additions = [...entryPoints]
    .filter((entry) => !paths.has(entry))
    .map((entry) => relativeSpecifier(configPath, entry));
  if (additions.length === 0) return content;
  const source = ts.createSourceFile(
    configPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JSON,
  );
  // TypeScript represents a JSON object's syntax as an expression statement.
  const statement = source.statements[0];
  if (
    !statement ||
    !ts.isExpressionStatement(statement) ||
    !ts.isObjectLiteralExpression(statement.expression)
  ) {
    throw new Error(`Could not locate compiler configuration properties: ${configPath}`);
  }
  const object = statement.expression;
  // Locate the existing property's syntax so only its value changes, not nearby comments.
  const property = object.properties.find(
    (node) =>
      ts.isPropertyAssignment(node) &&
      (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name)) &&
      node.name.text === "files",
  );
  const value = JSON.stringify([...files, ...additions]); // Preserve existing order; append new roots.
  const edits: Array<{ start: number; end: number; text: string }> = [];
  if (property && ts.isPropertyAssignment(property)) {
    edits.push({
      start: property.initializer.getStart(source),
      end: property.initializer.end,
      text: value,
    });
  } else {
    // Adding a property must work for {}, a compact object, and JSONC with a trailing comma.
    const last = object.properties[object.properties.length - 1];
    let separator = "";
    if (last && !object.properties.hasTrailingComma) {
      // In {"include":[]} the last value ends where insertion begins. Combine the comma and
      // new property into one edit; separate equal-offset edits can reverse their order.
      if (last.end === object.end - 1) separator = ",";
      // Otherwise put the comma after the last value, before any trailing comment.
      else edits.push({ start: last.end, end: last.end, text: "," });
    }
    edits.push({
      start: object.end - 1, // Insert before the closing brace, without replacing it.
      end: object.end - 1,
      text: `${separator}\n"files": ${value}\n`,
    });
  }
  return format(applyEdits(content, edits), "json");
}

/**
 * Applies non-overlapping edits from right to left so earlier source offsets remain valid.
 * This preserves text outside changed ranges instead of reprinting an entire syntax tree.
 * Callers must avoid conflicting edits, including ambiguous insertion order at equal offsets.
 * Simplify if: whole-file reprinting is acceptable and comment/format churn does not matter.
 */
function applyEdits(
  content: string,
  edits: Array<{ start: number; end: number; text: string }>,
): string {
  for (const { start, end, text } of edits.sort((left, right) => right.start - left.start)) {
    content = content.slice(0, start) + text + content.slice(end);
  }
  return content;
}

/**
 * Moves conventional package-relative src/ paths in manifest aliases and version metadata.
 * It retains the caller's leading ./ style and leaves external/non-source values unchanged.
 * Wildcard segments stay literal here; the mapping does not enumerate their matches.
 * Simplify if: one canonical path style and a fixed set of manifest properties are required.
 */
function relocatePackagePath(
  value: string,
  packageDirectory: string,
  srcDirectory: string,
  moveTarget: (target: string) => string,
): string {
  if (!value.startsWith("./src/") && !value.startsWith("src/")) return value;
  const target = path.resolve(packageDirectory, value);
  // A value beginning src/ can still escape through ..; do not relocate that destination.
  if (!isWithin(srcDirectory, target)) return value;
  const relative = path.relative(packageDirectory, moveTarget(target)).split(path.sep).join("/");
  return value.startsWith("./") ? `./${relative}` : relative;
}

/**
 * Maps string leaves in nested manifest values without changing condition names or other data.
 * Node imports can contain condition objects, fallback arrays, and null, not just flat strings.
 * Simplify if: generated imports always follow one fixed conditional mapping shape.
 */
function mapStrings(value: unknown, transform: (value: string) => string): unknown {
  if (typeof value === "string") return transform(value);
  if (Array.isArray(value)) return value.map((entry) => mapStrings(entry, transform));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, mapStrings(entry, transform)]),
    );
  }
  return value;
}

/**
 * Narrows parsed JSON to a non-null, non-array object before reading or assigning properties.
 * This validates the container, not the schema of its children.
 * Simplify if: a shared manifest/config parser supplies equivalent validated object types.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
