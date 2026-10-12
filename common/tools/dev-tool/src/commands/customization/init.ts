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

const log = createPrinter("customization-init");
const licenseHeader =
  "// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\n\n";
const sourceExtensions = /\.(?:[cm]?[jt]sx?)$/;
const ignoredDirectories = new Set(["node_modules", ".git", "temp", "review"]);

interface FileUpdate {
  path: string;
  original: string;
  updated: string;
}

export const commandInfo = makeCommandInfo(
  "init",
  "moves generated source to src/generated and preserves public entry points",
  {},
);

export default leafCommand(commandInfo, async () => {
  try {
    const info = await resolveProject(process.cwd());
    return await initializeCustomization(info.path);
  } catch (error) {
    log("❌ Could not initialize customization:", (error as Error).message);
    return false;
  }
});

/** Sets up separate generated source without changing the package's public export paths. */
export async function initializeCustomization(packageDirectory: string): Promise<boolean> {
  packageDirectory = path.resolve(packageDirectory);
  const srcDirectory = path.join(packageDirectory, "src");
  const generatedDirectory = path.join(srcDirectory, "generated");
  if (!(await fs.lstat(srcDirectory)).isDirectory()) {
    throw new Error(`Source directory is not a directory: ${srcDirectory}`);
  }
  if (await exists(generatedDirectory)) {
    if (!(await fs.lstat(generatedDirectory)).isDirectory()) {
      throw new Error(`Generated source location is not a directory: ${generatedDirectory}`);
    }
    log("src/generated already exists. No changes made.");
    return true;
  }
  if (await exists(path.join(packageDirectory, "generated"))) {
    throw new Error(
      "This package already uses root generated/ customization. Migrate its existing customizations before using this command.",
    );
  }

  const manifestPath = path.join(packageDirectory, "package.json");
  const originalManifest = await fs.readFile(manifestPath, "utf8");
  const manifest: unknown = JSON.parse(originalManifest);
  if (!isRecord(manifest)) throw new Error("package.json must contain an object.");
  const resolved = await findWarpConfig(packageDirectory);
  if (!resolved) {
    throw new Error("A Warp configuration is required to locate modular SDK entry points.");
  }

  const entryPoints = new Set<string>();
  for (const [subpath, source] of Object.entries(resolved.config.exports)) {
    if (subpath.includes("*") || source.includes("*")) {
      throw new Error(`Wildcard source exports are not supported: ${subpath}`);
    }
    const sourcePath = path.resolve(packageDirectory, source);
    if (!isWithin(srcDirectory, sourcePath)) continue;
    if (!/\.(?:[cm]?ts)$/.test(source)) {
      throw new Error(`Expected a TypeScript source entry point for ${subpath}: ${source}`);
    }
    await fs.access(sourcePath);
    entryPoints.add(sourcePath);
  }
  if (!entryPoints.has(path.join(srcDirectory, "index.ts"))) {
    throw new Error("The package root must export src/index.ts in its Warp configuration.");
  }
  if (isRecord(manifest.exports)) {
    for (const subpath of Object.keys(manifest.exports).filter((key) => key.startsWith("."))) {
      if (!(subpath in resolved.config.exports)) {
        throw new Error(`Public export has no Warp source mapping: ${subpath}`);
      }
    }
  }

  const sourceFiles = await listFiles(srcDirectory);
  const moveTarget = (target: string): string =>
    isWithin(srcDirectory, target)
      ? path.join(generatedDirectory, path.relative(srcDirectory, target))
      : target;
  const isPublicTarget = (target: string): boolean =>
    [...entryPoints].some(
      (entry) =>
        target === entry ||
        target === runtimePath(entry) ||
        target === entry.replace(/\.(?:[cm]?ts)$/, "") ||
        (path.basename(entry) === "index.ts" && target === path.dirname(entry)),
    );
  const moveInternalTarget = (target: string): string =>
    isPublicTarget(target) ? target : moveTarget(target);

  const generatedUpdates = new Map<string, string>();
  const barrels = new Map<string, string>();
  for (const file of sourceFiles) {
    if (!sourceExtensions.test(file)) continue;
    const content = await fs.readFile(file, "utf8");
    const relocated = moveTarget(file);
    const updated = rewriteModuleReferences(content, file, relocated, moveTarget);
    if (updated !== content) generatedUpdates.set(path.relative(srcDirectory, file), updated);
    if (entryPoints.has(file)) {
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      if (
        sourceFile.statements.some((node) => ts.isExportAssignment(node) && node.isExportEquals)
      ) {
        throw new Error(`CommonJS export assignments are not supported: ${file}`);
      }
      const target = relativeSpecifier(file, runtimePath(relocated));
      const defaultExport = sourceFile.statements.some(
        (node) =>
          (ts.isExportAssignment(node) && !node.isExportEquals) ||
          (ts.canHaveModifiers(node) &&
            ts
              .getModifiers(node)
              ?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) ||
          (ts.isExportDeclaration(node) &&
            node.exportClause &&
            ts.isNamedExports(node.exportClause) &&
            node.exportClause.elements.some((element) => element.name.text === "default")),
      );
      const packageDocs = (ts.getLeadingCommentRanges(content, 0) ?? [])
        .map(({ pos, end }) => content.slice(pos, end))
        .filter((comment) => comment.includes("@packageDocumentation"))
        .join("\n");
      barrels.set(
        path.relative(srcDirectory, file),
        `${licenseHeader}${packageDocs ? `${packageDocs}\n\n` : ""}export * from ${JSON.stringify(target)};\n${
          defaultExport ? `export { default } from ${JSON.stringify(target)};\n` : ""
        }`,
      );
    }
  }

  // Public export destinations remain unchanged; only private source references move.
  if (manifest.imports !== undefined) {
    manifest.imports = mapStrings(manifest.imports, (value) =>
      relocatePackagePath(value, packageDirectory, srcDirectory, moveTarget),
    );
  }
  const metadata = manifest["//metadata"];
  if (isRecord(metadata) && Array.isArray(metadata.constantPaths)) {
    for (const entry of metadata.constantPaths) {
      if (isRecord(entry) && typeof entry.path === "string") {
        entry.path = relocatePackagePath(entry.path, packageDirectory, srcDirectory, moveTarget);
      }
    }
  }
  if (manifest.scripts === undefined) manifest.scripts = {};
  if (!isRecord(manifest.scripts)) throw new Error("package.json scripts must contain an object.");
  if (!("customize" in manifest.scripts)) manifest.scripts.customize = "echo skipped";

  const externalUpdates: FileUpdate[] = [];
  for (const file of await listFiles(packageDirectory, new Set(["src"]), true)) {
    if (file === manifestPath) continue;
    const isConfig = /(?:^|[/\\])(?:tsconfig[^/\\]*|api-extractor)\.json$/.test(file);
    if (!sourceExtensions.test(file) && !isConfig) continue;
    const original = await fs.readFile(file, "utf8");
    const updated = isConfig
      ? rewriteConfigReferences(original, file, srcDirectory, moveTarget, moveInternalTarget)
      : rewriteModuleReferences(original, file, file, moveInternalTarget);
    if (updated !== original) externalUpdates.push({ path: file, original, updated });
  }
  // The root barrel now imports generated barrels, not the other public barrels.
  // Explicit roots ensure that every published subpath is still emitted.
  for (const configPath of new Set(
    resolved.config.targets.map((target) => path.resolve(packageDirectory, target.tsconfig)),
  )) {
    if (!isWithin(packageDirectory, configPath)) {
      throw new Error(`Compiler configuration requires manual localization: ${configPath}`);
    }
    const planned = externalUpdates.find((update) => update.path === configPath);
    const original = planned?.original ?? (await fs.readFile(configPath, "utf8"));
    const updated = await addCompilerEntryPoints(
      planned?.updated ?? original,
      configPath,
      entryPoints,
    );
    if (planned) planned.updated = updated;
    else if (updated !== original) externalUpdates.push({ path: configPath, original, updated });
  }
  const updatedManifest = await format(JSON.stringify(manifest, null, 2), "json-stringify");
  externalUpdates.push({
    path: manifestPath,
    original: originalManifest,
    updated: updatedManifest,
  });

  const temporaryDirectory = await fs.mkdtemp(path.join(packageDirectory, ".customization-init-"));
  const stagedSource = path.join(temporaryDirectory, "src");
  const originalSource = path.join(temporaryDirectory, "original-src");
  let preserveBackup = false;
  try {
    await fs.cp(srcDirectory, path.join(stagedSource, "generated"), { recursive: true });
    for (const [relative, content] of generatedUpdates) {
      await fs.writeFile(path.join(stagedSource, "generated", relative), content);
    }
    for (const [relative, content] of barrels) {
      const file = path.join(stagedSource, relative);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, content);
    }

    await fs.rename(srcDirectory, originalSource);
    const written: FileUpdate[] = [];
    let installed = false;
    try {
      await fs.rename(stagedSource, srcDirectory);
      installed = true;
      for (const update of externalUpdates) {
        written.push(update);
        await fs.writeFile(update.path, update.updated);
      }
    } catch (error) {
      try {
        for (const update of written.reverse()) await fs.writeFile(update.path, update.original);
        if (installed) await fs.rename(srcDirectory, path.join(temporaryDirectory, "failed-src"));
        await fs.rename(originalSource, srcDirectory);
      } catch (rollbackError) {
        preserveBackup = true;
        throw new AggregateError(
          [error, rollbackError],
          `Initialization failed and could not restore the original files. Backup: ${temporaryDirectory}`,
          { cause: rollbackError },
        );
      }
      throw error;
    }
  } finally {
    if (!preserveBackup) await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
  log(`✅ Moved source to src/generated and preserved ${barrels.size} public entry points.`);
  return true;
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.lstat(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function listFiles(
  directory: string,
  additionalIgnores = new Set<string>(),
  skipBuildArtifacts = false,
): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (
      additionalIgnores.has(entry.name) ||
      (skipBuildArtifacts &&
        (ignoredDirectories.has(entry.name) ||
          /^dist(?:-|$)/.test(entry.name) ||
          entry.name.startsWith(".customization-init-")))
    ) {
      continue;
    }
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links require manual migration: ${file}`);
    if (entry.isDirectory()) result.push(...(await listFiles(file, new Set(), skipBuildArtifacts)));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}

function isWithin(directory: string, target: string): boolean {
  const relative = path.relative(directory, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function runtimePath(file: string): string {
  return file
    .replace(/\.mts$/, ".mjs")
    .replace(/\.cts$/, ".cjs")
    .replace(/\.ts$/, ".js");
}

function relativeSpecifier(from: string, to: string): string {
  const relative = path.relative(path.dirname(from), to).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function rewriteModuleReferences(
  content: string,
  oldFile: string,
  newFile: string,
  moveTarget: (target: string) => string,
): string {
  const sourceFile = ts.createSourceFile(oldFile, content, ts.ScriptTarget.Latest, true);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const rewrite = (specifier: string): string => {
    if (!specifier.startsWith(".")) return specifier;
    const suffixIndex = specifier.search(/[?#]/);
    const source = suffixIndex === -1 ? specifier : specifier.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? "" : specifier.slice(suffixIndex);
    const target = path.resolve(path.dirname(oldFile), source);
    const relocated = moveTarget(target);
    if (
      path.relative(path.dirname(oldFile), target) ===
      path.relative(path.dirname(newFile), relocated)
    ) {
      return specifier;
    }
    return relativeSpecifier(newFile, relocated) + suffix;
  };
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node)) {
      const parent = node.parent;
      const isModule =
        (ts.isImportDeclaration(parent) && parent.moduleSpecifier === node) ||
        (ts.isExportDeclaration(parent) && parent.moduleSpecifier === node) ||
        ts.isExternalModuleReference(parent) ||
        (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent)) ||
        (ts.isCallExpression(parent) &&
          parent.arguments[0] === node &&
          (parent.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(parent.expression) && parent.expression.text === "require"))) ||
        (ts.isNewExpression(parent) &&
          ts.isIdentifier(parent.expression) &&
          parent.expression.text === "URL" &&
          parent.arguments?.[0] === node &&
          parent.arguments[1]?.getText(sourceFile) === "import.meta.url");
      if (isModule) {
        const updated = rewrite(node.text);
        if (updated !== node.text) {
          edits.push({
            start: node.getStart(sourceFile),
            end: node.end,
            text: JSON.stringify(updated),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  for (const reference of sourceFile.referencedFiles) {
    const updated = rewrite(reference.fileName);
    if (updated !== reference.fileName) {
      edits.push({ start: reference.pos, end: reference.end, text: updated });
    }
  }
  return applyEdits(content, edits);
}

function rewriteConfigReferences(
  content: string,
  file: string,
  srcDirectory: string,
  moveTarget: (target: string) => string,
  moveInternalTarget: (target: string) => string,
): string {
  const parsed = ts.parseConfigFileTextToJson(file, content);
  if (parsed.error) {
    throw new Error(`${file}: ${ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n")}`);
  }
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JSON,
  );
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteral(node) &&
      !(ts.isPropertyAssignment(node.parent) && node.parent.name === node) &&
      (node.text.startsWith(".") || node.text.startsWith("src/"))
    ) {
      const target = path.resolve(path.dirname(file), node.text);
      let internalAlias = false;
      for (let parent: ts.Node | undefined = node.parent; parent; parent = parent.parent) {
        if (
          ts.isPropertyAssignment(parent) &&
          ts.isStringLiteral(parent.name) &&
          parent.name.text.startsWith("$internal")
        ) {
          internalAlias = true;
        }
      }
      const prefix = target.split("*")[0].replace(/[/\\]$/, "");
      if (
        isWithin(srcDirectory, target) &&
        (internalAlias || (target !== srcDirectory && prefix !== srcDirectory))
      ) {
        const relocated = internalAlias ? moveTarget(target) : moveInternalTarget(target);
        if (relocated !== target) {
          edits.push({
            start: node.getStart(sourceFile),
            end: node.end,
            text: JSON.stringify(relativeSpecifier(file, relocated)),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return applyEdits(content, edits);
}

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
  const configured = config.files;
  if (
    configured !== undefined &&
    (!Array.isArray(configured) || configured.some((file) => typeof file !== "string"))
  ) {
    throw new Error(`Compiler files must be an array of paths: ${configPath}`);
  }
  const files: string[] = configured === undefined ? [] : configured;
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
  const statement = source.statements[0];
  if (
    !statement ||
    !ts.isExpressionStatement(statement) ||
    !ts.isObjectLiteralExpression(statement.expression)
  ) {
    throw new Error(`Could not locate compiler configuration properties: ${configPath}`);
  }
  const object = statement.expression;
  const property = object.properties.find(
    (node) =>
      ts.isPropertyAssignment(node) &&
      (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name)) &&
      node.name.text === "files",
  );
  const value = JSON.stringify([...files, ...additions]);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  if (property && ts.isPropertyAssignment(property)) {
    edits.push({
      start: property.initializer.getStart(source),
      end: property.initializer.end,
      text: value,
    });
  } else {
    const last = object.properties[object.properties.length - 1];
    let separator = "";
    if (last && !object.properties.hasTrailingComma) {
      if (last.end === object.end - 1) separator = ",";
      else edits.push({ start: last.end, end: last.end, text: "," });
    }
    edits.push({
      start: object.end - 1,
      end: object.end - 1,
      text: `${separator}\n"files": ${value}\n`,
    });
  }
  return format(applyEdits(content, edits), "json");
}

function applyEdits(
  content: string,
  edits: Array<{ start: number; end: number; text: string }>,
): string {
  for (const { start, end, text } of edits.sort((left, right) => right.start - left.start)) {
    content = content.slice(0, start) + text + content.slice(end);
  }
  return content;
}

function relocatePackagePath(
  value: string,
  packageDirectory: string,
  srcDirectory: string,
  moveTarget: (target: string) => string,
): string {
  if (!value.startsWith("./src/") && !value.startsWith("src/")) return value;
  const target = path.resolve(packageDirectory, value);
  if (!isWithin(srcDirectory, target)) return value;
  const relative = path.relative(packageDirectory, moveTarget(target)).split(path.sep).join("/");
  return value.startsWith("./") ? `./${relative}` : relative;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
