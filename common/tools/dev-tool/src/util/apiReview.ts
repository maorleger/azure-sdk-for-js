// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const parserVersion = "0.4.0";
const profiles = ["import", "require", "browser", "react-native", "workerd"] as const;
type Profile = (typeof profiles)[number];
const statusTags = new Set(["alpha", "beta", "internal", "deprecated"]);
const helperSection = "#helpers";
const importSection = "#imports";
const globalSection = "#globals";

interface Entry {
  subpath: string;
  conditions: string[];
  types: Partial<Record<Profile, string>>;
  legacy?: boolean;
}

interface Location {
  subpath: string;
  name: string;
  typeOnly: boolean;
}

interface ExternalReference {
  specifier: string;
  name: string;
}

interface Item {
  section: string;
  /** `code`, `own`, `differs`, or `also\0<home subpath>`; see renderSections. */
  group: string;
  key: string;
  text: string;
}

interface PackageContext {
  root: string;
  name: string;
  version: string;
  entries: Entry[];
  isLocal(file: string): boolean;
  ownerName(file: string): string | undefined;
}

interface Surface {
  items: Item[];
  declarationCount: number;
  helperCount: number;
}

export interface ApiReview {
  markdown: string;
  metadata: string;
  apiMdSha256: string;
  entryCount: number;
  declarationCount: number;
  helperCount: number;
  profiles: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readManifest(file: string): Record<string, unknown> {
  const value: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (!isRecord(value)) throw new Error(`Expected a package manifest object: ${file}`);
  return value;
}

function requiredString(value: unknown, description: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected a nonempty string for ${description}.`);
  }
  return value;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareNames(a: string, b: string): number {
  return compare(a.toLowerCase(), b.toLowerCase()) || compare(a, b);
}

function relative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

function contains(root: string, file: string): boolean {
  const name = path.relative(root, file);
  return name !== ".." && !name.startsWith(`..${path.sep}`) && !path.isAbsolute(name);
}

function isProfile(value: string): value is Profile {
  return (profiles as readonly string[]).includes(value);
}

function entriesFromManifest(manifest: Record<string, unknown>): Entry[] {
  if (manifest.typesVersions !== undefined) {
    throw new Error("typesVersions is not supported by this prototype.");
  }
  if (manifest.exports === undefined) {
    return [
      {
        subpath: ".",
        conditions: ["types"],
        types: { import: requiredString(manifest.types, "package.json types") },
        legacy: true,
      },
    ];
  }
  const exports = manifest.exports;
  if (!isRecord(exports) || !Object.keys(exports).every((key) => key.startsWith("."))) {
    throw new Error(
      "Expected an explicit subpath export map (no patterns, arrays, or root shorthand).",
    );
  }
  const entries: Entry[] = [];
  for (const subpath of Object.keys(exports).sort(compare)) {
    if (subpath === "./package.json") continue;
    if ((subpath !== "." && !subpath.startsWith("./")) || /[*\\]/.test(subpath)) {
      throw new Error(`Unsupported export subpath: ${subpath}`);
    }
    const conditions = exports[subpath];
    if (!isRecord(conditions) || !isRecord(conditions.import)) {
      throw new Error(
        `Expected an import condition with { types, default } for export ${subpath}.`,
      );
    }
    const types: Partial<Record<Profile, string>> = {};
    for (const [condition, target] of Object.entries(conditions)) {
      if (!isProfile(condition)) {
        throw new Error(`Unsupported condition "${condition}" for export ${subpath}.`);
      }
      if (
        !isRecord(target) ||
        Object.keys(target).some((key) => key !== "types" && key !== "default") ||
        (target.default !== undefined && typeof target.default !== "string")
      ) {
        throw new Error(
          `Expected a ${condition} condition with { types, default } for export ${subpath}.`,
        );
      }
      types[condition] = requiredString(target.types, `${subpath} / ${condition} types`);
    }
    entries.push({ subpath, conditions: Object.keys(conditions), types });
  }
  if (entries.length === 0) throw new Error("The package has no supported type entry points.");
  return entries;
}

function codeBlock(text: string, language: string): string {
  const longestFence = Math.max(0, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(Math.max(3, longestFence + 1));
  return `${fence}${language}\n${text.trimEnd()}\n${fence}`;
}

function inline(text: string): string {
  const fence = "`".repeat(
    Math.max(0, ...Array.from(text.matchAll(/`+/g), (m) => m[0].length)) + 1,
  );
  const padding = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${padding}${text.replace(/[\r\n]/g, " ").replace(/\|/g, "&#124;")}${padding}${fence}`;
}

function exportList(keyword: string, names: string[], from?: string): string {
  const suffix = from === undefined ? ";" : ` from ${JSON.stringify(from)};`;
  if (names.length === 1) return `${keyword} { ${names[0]} }${suffix}`;
  return `${keyword} {\n${names.map((name) => `    ${name},`).join("\n")}\n}${suffix}`;
}

function assertReviewable(source: ts.SourceFile): void {
  if (!source.isDeclarationFile || !ts.isExternalModule(source)) {
    throw new Error(
      `Expected a module declaration file, not source or a global script: ${source.fileName}`,
    );
  }
  const visit = (node: ts.Node): void => {
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal) &&
      node.argument.literal.text.startsWith(".") &&
      (!node.qualifier || !ts.isIdentifier(node.qualifier))
    ) {
      throw new Error(
        `Unsupported import type of a package module without a named member in ${source.fileName}.`,
      );
    }
    if (
      (ts.isExportAssignment(node) && node.isExportEquals) ||
      ts.isNamespaceExportDeclaration(node) ||
      (ts.isModuleDeclaration(node) &&
        (ts.isStringLiteral(node.name) ||
          ((node.flags & ts.NodeFlags.GlobalAugmentation) !== 0 && !ts.isSourceFile(node.parent))))
    ) {
      throw new Error(`Unsupported ${ts.SyntaxKind[node.kind]} in ${source.fileName}.`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function unresolvedReferences(
  file: ts.SourceFile,
  program: ts.Program,
  options: ts.CompilerOptions,
  host: ts.CompilerHost,
): string[] {
  const checker = program.getTypeChecker();
  const problems: string[] = [];
  for (const reference of file.typeReferenceDirectives) {
    const resolved = ts.resolveTypeReferenceDirective(
      reference.fileName,
      file.fileName,
      options,
      host,
    ).resolvedTypeReferenceDirective;
    if (!resolved?.resolvedFileName) {
      problems.push(`Cannot resolve type reference directive '${reference.fileName}'.`);
    }
  }
  for (const reference of file.referencedFiles) {
    const target = path.resolve(path.dirname(file.fileName), reference.fileName);
    if (!program.getSourceFile(target)) {
      problems.push(`Cannot resolve referenced file '${reference.fileName}'.`);
    }
  }
  const visit = (node: ts.Node): void => {
    const specifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier
        ? node.moduleSpecifier
        : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal
          : ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)
            ? node.moduleReference.expression
            : undefined;
    if (specifier && ts.isStringLiteral(specifier) && !checker.getSymbolAtLocation(specifier)) {
      problems.push(`Cannot find module '${specifier.text}'.`);
    }
    const binding =
      ts.isImportSpecifier(node) || ts.isExportSpecifier(node) || ts.isNamespaceImport(node)
        ? node.name
        : ts.isImportClause(node)
          ? node.name
          : undefined;
    const symbol = binding && checker.getSymbolAtLocation(binding);
    if (
      binding &&
      symbol &&
      symbol.flags & ts.SymbolFlags.Alias &&
      !checker.getAliasedSymbol(symbol).declarations?.length
    ) {
      problems.push(`Cannot resolve imported or re-exported name '${binding.text}'.`);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return problems;
}

function compilerOptions(profile: Profile): ts.CompilerOptions {
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    // Ambient conflicts between runtime shims and lib/@types packages do not change review text.
    // Module and imported-name resolution is verified separately instead.
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2023,
    lib: ["lib.esnext.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    types: [],
  };
  if (profile === "import" || profile === "require") {
    options.module = ts.ModuleKind.NodeNext;
    options.moduleResolution = ts.ModuleResolutionKind.NodeNext;
  } else {
    // Bundlers select the named condition with import/types, but not node.
    options.module = ts.ModuleKind.ESNext;
    options.moduleResolution = ts.ModuleResolutionKind.Bundler;
    options.customConditions = [profile];
  }
  return options;
}

function createHost(root: string, profile: Profile, options: ts.CompilerOptions): ts.CompilerHost {
  const host = ts.createCompilerHost(options);
  host.getCurrentDirectory = () => root;
  options.typeRoots = ts.getEffectiveTypeRoots(options, host);
  // Node typings participate only when the input's dependency environment provides them.
  options.types = ["node"].filter(
    (types) =>
      ts.resolveTypeReferenceDirective(types, consumerFor(root, profile), options, host)
        .resolvedTypeReferenceDirective !== undefined,
  );
  return host;
}

function consumerFor(root: string, profile: Profile): string {
  return path.join(root, profile === "require" ? "__api_review__.cts" : "__api_review__.mts");
}

function commonDirectory(files: string[]): string {
  return files.map(path.dirname).reduce((common, directory) => {
    while (!contains(common, directory)) common = path.dirname(common);
    return common;
  });
}

function isPrivateMember(member: ts.Node): boolean {
  if (!ts.isClassElement(member) || ts.isConstructorDeclaration(member)) return false;
  if (member.name && ts.isPrivateIdentifier(member.name)) return true;
  return (ts.getCombinedModifierFlags(member as ts.Declaration) & ts.ModifierFlags.Private) !== 0;
}

function isGlobalDeclaration(declaration: ts.Node): boolean {
  for (let node = declaration.parent; node; node = node.parent) {
    if (ts.isModuleDeclaration(node)) {
      if ((node.flags & ts.NodeFlags.GlobalAugmentation) !== 0) return true;
      if (ts.isStringLiteral(node.name)) return false;
    }
    if (ts.isSourceFile(node)) return !ts.isExternalModule(node);
  }
  return false;
}

function ambientModuleName(declaration: ts.Node): string | undefined {
  for (let node = declaration.parent; node; node = node.parent) {
    if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) return node.name.text;
  }
  return undefined;
}

function moduleSpecifierOf(declaration: ts.Node): string | undefined {
  const statement = ts.findAncestor(
    declaration,
    (node) =>
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isImportEqualsDeclaration(node),
  ) as ts.ImportDeclaration | ts.ExportDeclaration | ts.ImportEqualsDeclaration | undefined;
  if (!statement) return undefined;
  const specifier = ts.isImportEqualsDeclaration(statement)
    ? ts.isExternalModuleReference(statement.moduleReference)
      ? statement.moduleReference.expression
      : undefined
    : statement.moduleSpecifier;
  return specifier && ts.isStringLiteral(specifier) ? specifier.text : undefined;
}

function importedName(declaration: ts.Node): string {
  if (ts.isImportSpecifier(declaration) || ts.isExportSpecifier(declaration)) {
    return (declaration.propertyName ?? declaration.name).text;
  }
  return ts.isImportClause(declaration) ? "default" : "*";
}

function statusComments(node: ts.Node): string[] {
  return [
    ...new Set(
      ts
        .getJSDocTags(node)
        .map((tag) => tag.tagName.text)
        .filter((tag) => statusTags.has(tag))
        .map((tag) => `@${tag}`),
    ),
  ].sort(compare);
}

function withComments<T extends ts.Node>(node: T, comments: string[]): T {
  for (const comment of comments) {
    ts.addSyntheticLeadingComment(node, ts.SyntaxKind.SingleLineCommentTrivia, ` ${comment}`, true);
  }
  return node;
}

function quiet(node: ts.Node): void {
  ts.setEmitFlags(node, ts.EmitFlags.NoComments);
  ts.forEachChild(node, quiet);
}

/** Build one runtime view as keyed review items that do not depend on file layout. */
function buildSurface(pkg: PackageContext, profile: Profile): Surface {
  const options = compilerOptions(profile);
  const host = createHost(pkg.root, profile, options);
  const consumer = consumerFor(pkg.root, profile);
  const roots = pkg.entries.map((entry) => {
    const label = `${entry.subpath} / ${profile}`;
    const declared = entry.types[profile];
    if (declared === undefined) {
      throw new Error(`${pkg.name}: ${label} is missing; conditions must cover every export.`);
    }
    const declaredPath = path.resolve(pkg.root, declared);
    if (
      (!entry.legacy && !declared.startsWith("./")) ||
      !/\.d\.(?:ts|mts|cts)$/.test(declared) ||
      !contains(pkg.root, declaredPath) ||
      !existsSync(declaredPath)
    ) {
      throw new Error(
        `${pkg.name}: ${label} requires an existing package-local declaration: ${declared}`,
      );
    }
    const entryPath = realpathSync(declaredPath);
    if (!pkg.isLocal(entryPath)) {
      throw new Error(`${pkg.name}: ${label} declaration belongs to another package: ${declared}`);
    }
    if (!entry.legacy) {
      const specifier = pkg.name + (entry.subpath === "." ? "" : entry.subpath.slice(1));
      const resolved = ts.resolveModuleName(
        specifier,
        consumer,
        options,
        host,
        undefined,
        undefined,
        profile === "require" ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
      ).resolvedModule;
      if (!resolved || realpathSync(resolved.resolvedFileName) !== entryPath) {
        throw new Error(
          `${pkg.name}: ${label} does not resolve to ${declared}; check condition precedence.`,
        );
      }
    }
    return entryPath;
  });
  const program = ts.createProgram({ rootNames: roots, options, host });
  // Creating the checker binds every file, which sets the parent pointers used below.
  const checker = program.getTypeChecker();
  for (const file of program.getSourceFiles()) {
    if (!file.isDeclarationFile) {
      throw new Error(
        `${pkg.name}: resolved implementation source instead of declarations: ${file.fileName}`,
      );
    }
    if (pkg.isLocal(file.fileName)) assertReviewable(file);
  }
  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSyntacticDiagnostics(),
  ];
  if (diagnostics.length > 0) {
    throw new Error(`${pkg.name}: ${profile} review\n${ts.formatDiagnostics(diagnostics, host)}`);
  }
  const unresolved = program
    .getSourceFiles()
    .filter((file) => pkg.isLocal(file.fileName))
    .flatMap((file) =>
      unresolvedReferences(file, program, options, host).map(
        (problem) => `${relative(pkg.root, file.fileName)}: ${problem}`,
      ),
    );
  if (unresolved.length > 0) {
    throw new Error(`${pkg.name}: ${profile} review\n${unresolved.join("\n")}`);
  }
  const globalAugmentations = program
    .getSourceFiles()
    .filter((file) => pkg.isLocal(file.fileName))
    .flatMap((file) =>
      file.statements.filter(
        (statement): statement is ts.ModuleDeclaration =>
          ts.isModuleDeclaration(statement) &&
          (statement.flags & ts.NodeFlags.GlobalAugmentation) !== 0,
      ),
    );
  const profileRoot = commonDirectory(roots);
  const isLocalNode = (node: ts.Node): boolean => pkg.isLocal(node.getSourceFile().fileName);
  const normalize = (symbol: ts.Symbol): ts.Symbol =>
    checker.getExportSymbolOfSymbol(
      symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol,
    );
  const localDeclarations = (symbol: ts.Symbol): ts.Declaration[] =>
    (symbol.declarations ?? []).filter(isLocalNode);
  const isModuleSymbol = (symbol: ts.Symbol): boolean =>
    (symbol.declarations ?? []).some(ts.isSourceFile);
  const isSelf = (specifier: string): boolean =>
    specifier === pkg.name || specifier.startsWith(`${pkg.name}/`);

  function externalOf(symbol: ts.Symbol): ExternalReference | undefined {
    const seen = new Set<ts.Symbol>();
    let current: ts.Symbol | undefined = symbol;
    while (current && current.flags & ts.SymbolFlags.Alias && !seen.has(current)) {
      seen.add(current);
      const declaration = current.declarations?.[0];
      if (!declaration || !isLocalNode(declaration)) return undefined;
      const specifier = moduleSpecifierOf(declaration);
      if (specifier !== undefined && !specifier.startsWith(".") && !isSelf(specifier)) {
        return { specifier, name: importedName(declaration) };
      }
      current = checker.getImmediateAliasedSymbol(current);
    }
    return undefined;
  }

  function ownerReference(symbol: ts.Symbol): ExternalReference | undefined {
    const declaration = symbol.declarations?.[0];
    if (!declaration) return undefined;
    const specifier =
      ambientModuleName(declaration) ?? pkg.ownerName(declaration.getSourceFile().fileName);
    return specifier === undefined ? undefined : { specifier, name: symbol.name };
  }

  // A reference to a namespace member resolves to its outermost local namespace.
  function topLevelSymbol(declaration: ts.Declaration): ts.Symbol | undefined {
    let node: ts.Node = ts.isVariableDeclaration(declaration)
      ? declaration.parent.parent
      : declaration;
    if (!node.parent || ts.isSourceFile(node)) return undefined;
    while (!ts.isSourceFile(node.parent)) {
      if (!ts.isModuleBlock(node.parent) && !ts.isModuleDeclaration(node.parent)) return undefined;
      node = node.parent;
    }
    // Global augmentations have their own section; their members are not package declarations.
    if (ts.isModuleDeclaration(node) && (node.flags & ts.NodeFlags.GlobalAugmentation) !== 0) {
      return undefined;
    }
    const name =
      node === declaration || node === declaration.parent.parent
        ? ts.getNameOfDeclaration(declaration)
        : (node as ts.ModuleDeclaration).name;
    const symbol = name && checker.getSymbolAtLocation(name);
    return symbol ? normalize(symbol) : undefined;
  }

  function topLevelDeclarations(symbol: ts.Symbol): ts.Declaration[] {
    return localDeclarations(symbol)
      .filter((declaration) =>
        ts.isVariableDeclaration(declaration)
          ? ts.isSourceFile(declaration.parent.parent.parent)
          : !ts.isSourceFile(declaration) && ts.isSourceFile(declaration.parent),
      )
      .sort(
        (a, b) =>
          compare(
            relative(profileRoot, a.getSourceFile().fileName),
            relative(profileRoot, b.getSourceFile().fileName),
          ) || a.pos - b.pos,
      );
  }

  // The module's value type can include names reached only through `export type *`.
  function hasValueExport(
    module: ts.Symbol,
    exportName: string,
    visited = new Set<ts.Symbol>(),
  ): boolean {
    if (visited.has(module)) return false;
    visited.add(module);
    const source = module.declarations?.find(ts.isSourceFile);
    if (!source) throw new Error(`Cannot determine export exposure in ${module.name}.`);
    if (module.exports?.has(ts.escapeLeadingUnderscores(exportName))) {
      return (
        checker.getTypeOfSymbolAtLocation(module, source).getProperty(exportName) !== undefined
      );
    }
    return source.statements.some((statement) => {
      if (
        !ts.isExportDeclaration(statement) ||
        statement.exportClause ||
        statement.isTypeOnly ||
        !statement.moduleSpecifier
      ) {
        return false;
      }
      const target = checker.getSymbolAtLocation(statement.moduleSpecifier);
      return target !== undefined && hasValueExport(target, exportName, new Set(visited));
    });
  }

  const locations = new Map<ts.Symbol, Location[]>();
  const externalExports: Array<Location & { specifier: string; importedName: string }> = [];
  const addLocation = (symbol: ts.Symbol, location: Location): void => {
    locations.set(symbol, [...(locations.get(symbol) ?? []), location]);
  };
  function collectExports(
    module: ts.Symbol,
    subpath: string,
    prefix: string,
    visited: Set<ts.Symbol>,
  ): void {
    for (const exported of checker
      .getExportsOfModule(module)
      .sort((a, b) => compare(a.name, b.name))) {
      const symbol = normalize(exported);
      const name = prefix + exported.name;
      const typeOnly =
        prefix === "" &&
        (symbol.flags & ts.SymbolFlags.Value) !== 0 &&
        !isModuleSymbol(symbol) &&
        !hasValueExport(module, exported.name);
      if (localDeclarations(symbol).length === 0) {
        const reference = externalOf(exported) ?? ownerReference(symbol);
        if (!reference) throw new Error(`${pkg.name}: cannot locate the origin of ${name}.`);
        externalExports.push({
          subpath,
          name,
          typeOnly,
          specifier: reference.specifier,
          importedName: reference.name,
        });
        continue;
      }
      addLocation(symbol, { subpath, name, typeOnly });
      if (isModuleSymbol(symbol) && !visited.has(symbol)) {
        collectExports(symbol, subpath, `${name}.`, new Set([...visited, symbol]));
      }
    }
  }
  pkg.entries.forEach((entry, index) => {
    const source = program.getSourceFile(roots[index]);
    const module = source && checker.getSymbolAtLocation(source);
    if (!module) throw new Error(`${pkg.name}: no module symbol for ${entry.subpath}.`);
    collectExports(module, entry.subpath, "", new Set([module]));
  });

  const locationOrder = (a: Location, b: Location): number =>
    compare(a.subpath, b.subpath) ||
    Number(a.name.includes(".")) - Number(b.name.includes(".")) ||
    Number(a.name === "default") - Number(b.name === "default") ||
    compareNames(a.name, b.name);
  const primary = new Map<ts.Symbol, Location>();
  for (const [symbol, list] of locations) {
    list.sort(locationOrder);
    primary.set(symbol, list[0]);
  }
  // Reachability: only package-local declarations named by public declarations are shown.
  // Each helper records the first public root that reaches it; collisions are ordered by that
  // provenance and by content, never by file layout.
  const rendered = new Set(locations.keys());
  const origins = new Map<ts.Symbol, string>();
  const declarationNodes = (symbol: ts.Symbol): ts.Node[] =>
    topLevelDeclarations(symbol).map((declaration) =>
      ts.isVariableDeclaration(declaration) ? declaration.parent.parent : declaration,
    );
  const reach = (roots: ts.Node[], origin: string): void => {
    const queue = [...roots];
    const walk = (node: ts.Node): void => {
      if (isPrivateMember(node)) return;
      if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        const declaration = symbol && localDeclarations(normalize(symbol))[0];
        const top = declaration && topLevelSymbol(declaration);
        if (top && !rendered.has(top)) {
          rendered.add(top);
          origins.set(top, origin);
          queue.push(...declarationNodes(top));
        }
      }
      ts.forEachChild(node, walk);
    };
    while (queue.length) walk(queue.shift()!);
  };
  const plainPrinter = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: true });
  const content = (node: ts.Node): string =>
    plainPrinter.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
  const rootKey = (symbol: ts.Symbol): string =>
    `${primary.get(symbol)!.subpath}\0${primary.get(symbol)!.name}`;
  for (const symbol of [...locations.keys()].sort((a, b) => compare(rootKey(a), rootKey(b)))) {
    reach(declarationNodes(symbol), rootKey(symbol));
  }
  for (const augmentation of [...globalAugmentations].sort((a, b) =>
    compare(content(a), content(b)),
  )) {
    reach([augmentation], `\uffff${content(augmentation)}`);
  }

  const declaredName = (symbol: ts.Symbol): string => {
    const declaration = localDeclarations(symbol)[0];
    const name =
      declaration && !ts.isSourceFile(declaration) && ts.getNameOfDeclaration(declaration);
    return name && ts.isIdentifier(name) ? name.text : symbol.name;
  };
  const desiredName = (symbol: ts.Symbol): string => {
    const location = primary.get(symbol);
    if (!location) return declaredName(symbol);
    const last = location.name.split(".").pop()!;
    return location.name === "default" ? declaredName(symbol) : last;
  };
  const sortKey = (symbol: ts.Symbol): string => {
    const location = primary.get(symbol);
    return location
      ? ["0", location.subpath, location.name].join("\0")
      : ["1", origins.get(symbol) ?? "", declarationNodes(symbol).map(content).join("\n")].join(
          "\0",
        );
  };
  const taken = new Set<string>();
  const unique = (base: string): string => {
    let name = base;
    for (let index = 2; taken.has(name); index++) name = `${base}_${index}`;
    taken.add(name);
    return name;
  };
  // Each export path is its own scope, so an exported declaration keeps its public name in its
  // home section. Helpers and external names stay unique across the whole document.
  const names = new Map<ts.Symbol, string>();
  const sectionNames = new Map<string, Set<string>>();
  for (const symbol of [...rendered].sort(
    (a, b) =>
      compare(sortKey(a).slice(0, 1), sortKey(b).slice(0, 1)) ||
      compareNames(desiredName(a), desiredName(b)) ||
      compare(sortKey(a), sortKey(b)),
  )) {
    const location = primary.get(symbol);
    if (!location) {
      names.set(symbol, unique(desiredName(symbol)));
      continue;
    }
    const used = sectionNames.get(location.subpath) ?? new Set<string>();
    sectionNames.set(location.subpath, used);
    const base = desiredName(symbol);
    let name = base;
    for (let index = 2; used.has(name); index++) name = `${base}_${index}`;
    used.add(name);
    taken.add(name);
    names.set(symbol, name);
  }
  const rootSection = pkg.entries[0].subpath;
  const specifierFor = (subpath: string): string =>
    pkg.name + (subpath === "." ? "" : subpath.slice(1));
  const exportedOwners = new Map<string, number>();
  for (const symbol of locations.keys()) {
    const name = names.get(symbol)!;
    exportedOwners.set(name, (exportedOwners.get(name) ?? 0) + 1);
  }
  const aliasBase = (subpath: string): string => {
    const words = (subpath === "." ? pkg.name.replace(/^@[^/]+\//, "") : subpath.slice(2))
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean);
    const text = words
      .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
      .join("");
    return /^[A-Za-z_$]/.test(text) ? text : `_${text}`;
  };
  let currentSection = rootSection;

  const imports = new Map<string, Map<string, string>>();
  const externalName = (reference: ExternalReference, localText: string): string => {
    const bySpecifier = imports.get(reference.specifier) ?? new Map<string, string>();
    imports.set(reference.specifier, bySpecifier);
    const existing = bySpecifier.get(reference.name);
    if (existing) return existing;
    const display =
      reference.name === "*" || reference.name === "default"
        ? unique(localText)
        : unique(reference.name);
    bySpecifier.set(reference.name, display);
    return display;
  };
  // A name that several exported declarations share is qualified with its home export path
  // whenever it is referenced from another section, e.g. `models.TypeTwo`.
  const displayName = (target: ts.Symbol): string | undefined => {
    const canonical = names.get(target);
    const home = primary.get(target)?.subpath;
    if (
      canonical === undefined ||
      home === undefined ||
      home === currentSection ||
      (exportedOwners.get(canonical) ?? 0) < 2
    ) {
      return canonical;
    }
    const alias = externalName({ specifier: specifierFor(home), name: "*" }, aliasBase(home));
    return `${alias}.${canonical}`;
  };
  const referenceName = (identifier: ts.Identifier): string | undefined => {
    const symbol = checker.getSymbolAtLocation(identifier);
    if (!symbol) return undefined;
    const external = symbol.flags & ts.SymbolFlags.Alias ? externalOf(symbol) : undefined;
    if (external) return externalName(external, identifier.text);
    const target = normalize(symbol);
    const canonical = displayName(target);
    if (canonical) return canonical;
    if (localDeclarations(target).length || (target.declarations ?? []).some(isGlobalDeclaration)) {
      return undefined;
    }
    const owner = ownerReference(target);
    return owner ? externalName(owner, identifier.text) : undefined;
  };
  const namespaceImport = (node: ts.Node): ExternalReference | undefined => {
    if (!ts.isIdentifier(node)) return undefined;
    const symbol = checker.getSymbolAtLocation(node);
    const external = symbol && symbol.flags & ts.SymbolFlags.Alias ? externalOf(symbol) : undefined;
    return external?.name === "*" ? external : undefined;
  };
  const assertMember = (namespace: ts.Node, member: ts.Identifier): void => {
    const symbol = checker.getSymbolAtLocation(member);
    if (!symbol || !normalize(symbol).declarations?.length) {
      throw new Error(`${pkg.name}: cannot resolve ${namespace.getText()}.${member.text}.`);
    }
  };
  const localCanonical = (identifier: ts.Identifier): string | undefined => {
    const symbol = checker.getSymbolAtLocation(identifier);
    return symbol && displayName(normalize(symbol));
  };

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  function renderStatement(
    statement: ts.Statement,
    declaration: ts.Declaration,
    canonical: string,
    exported: boolean,
    notes: string[],
  ): string {
    const nameNode = ts.getNameOfDeclaration(declaration);
    const transformer: ts.TransformerFactory<ts.Statement> = (context) => {
      const { factory } = context;
      const entity = (name: string): ts.EntityName =>
        name
          .split(".")
          .map((part) => factory.createIdentifier(part) as ts.EntityName)
          .reduce((left, right) => factory.createQualifiedName(left, right as ts.Identifier));
      const expression = (name: string): ts.Expression =>
        name
          .split(".")
          .map((part) => factory.createIdentifier(part) as ts.Expression)
          .reduce((left, right) =>
            factory.createPropertyAccessExpression(left, right as ts.Identifier),
          );
      const rewriteEntity = (entityName: ts.EntityName): ts.EntityName => {
        if (ts.isIdentifier(entityName)) {
          const name = referenceName(entityName);
          return name && name !== entityName.text ? entity(name) : entityName;
        }
        const entity_ = entityName;
        const namespace = namespaceImport(entity_.left);
        if (namespace) {
          assertMember(entity_.left, entity_.right);
          return factory.createIdentifier(
            externalName(
              { specifier: namespace.specifier, name: entity_.right.text },
              entity_.right.text,
            ),
          );
        }
        const local = localCanonical(entity_.right);
        if (local) return entity(local);
        return factory.updateQualifiedName(entity_, rewriteEntity(entity_.left), entity_.right);
      };
      const rewriteExpression = (node: ts.Expression): ts.Expression => {
        if (ts.isIdentifier(node)) {
          const name = referenceName(node);
          return name && name !== node.text ? expression(name) : node;
        }
        if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
          const namespace = namespaceImport(node.expression);
          const local = localCanonical(node.name);
          if (namespace) {
            assertMember(node.expression, node.name);
            const name = node.name.text;
            return factory.createIdentifier(
              externalName({ specifier: namespace.specifier, name }, name),
            );
          }
          if (local) return expression(local);
          return factory.updatePropertyAccessExpression(
            node,
            rewriteExpression(node.expression),
            node.name,
          );
        }
        return ts.visitNode(node, visit) as ts.Expression;
      };
      const visitTypes = (types: ts.NodeArray<ts.TypeNode> | undefined) =>
        types && ts.visitNodes(types, visit, ts.isTypeNode);
      const visit = (node: ts.Node): ts.Node | undefined => {
        if (node === nameNode && ts.isIdentifier(node) && node.text !== canonical) {
          return factory.createIdentifier(canonical);
        }
        if (isPrivateMember(node)) {
          return undefined;
        }
        let result: ts.Node;
        if (ts.isTypeReferenceNode(node)) {
          result = factory.updateTypeReferenceNode(
            node,
            rewriteEntity(node.typeName),
            visitTypes(node.typeArguments),
          );
        } else if (ts.isExpressionWithTypeArguments(node)) {
          result = factory.updateExpressionWithTypeArguments(
            node,
            rewriteExpression(node.expression),
            visitTypes(node.typeArguments),
          );
        } else if (ts.isTypeQueryNode(node)) {
          result = factory.updateTypeQueryNode(
            node,
            rewriteEntity(node.exprName),
            visitTypes(node.typeArguments),
          );
        } else if (ts.isComputedPropertyName(node)) {
          result = factory.updateComputedPropertyName(node, rewriteExpression(node.expression));
        } else if (
          ts.isImportTypeNode(node) &&
          node.qualifier &&
          ts.isIdentifier(node.qualifier) &&
          ts.isLiteralTypeNode(node.argument) &&
          ts.isStringLiteral(node.argument.literal)
        ) {
          const specifier = node.argument.literal.text;
          const name =
            localCanonical(node.qualifier) ??
            (specifier.startsWith(".") || isSelf(specifier)
              ? undefined
              : externalName({ specifier, name: node.qualifier.text }, node.qualifier.text));
          if (!name) return ts.visitEachChild(node, visit, context);
          result = node.isTypeOf
            ? factory.createTypeQueryNode(entity(name), visitTypes(node.typeArguments))
            : factory.createTypeReferenceNode(entity(name), visitTypes(node.typeArguments));
        } else {
          result = ts.visitEachChild(node, visit, context);
        }
        if (
          node !== statement &&
          node !== declaration &&
          (ts.isClassElement(node) || ts.isTypeElement(node) || ts.isEnumMember(node))
        ) {
          withComments(result, statusComments(node));
        }
        return result;
      };
      return (root) => ts.visitNode(root, visit) as ts.Statement;
    };
    const transformed = ts.transform(statement, [transformer]);
    let result = transformed.transformed[0];
    if (nameNode && ts.canHaveModifiers(result)) {
      const isClass = ts.isClassDeclaration(result);
      // Classes read like source (`export class`); other ambient forms keep `declare`.
      const kept = (ts.getModifiers(result) ?? []).filter(
        (modifier) =>
          modifier.kind !== ts.SyntaxKind.ExportKeyword &&
          modifier.kind !== ts.SyntaxKind.DefaultKeyword &&
          !(isClass && modifier.kind === ts.SyntaxKind.DeclareKeyword),
      );
      const needsDeclare =
        (ts.isFunctionDeclaration(result) ||
          ts.isVariableStatement(result) ||
          ts.isEnumDeclaration(result) ||
          ts.isModuleDeclaration(result)) &&
        !kept.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword);
      result = ts.factory.replaceModifiers(result, [
        ...(exported ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)] : []),
        ...(needsDeclare ? [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)] : []),
        ...kept,
      ]);
    }
    quiet(result);
    const comments = [...statusComments(declaration), ...notes];
    withComments(result, comments);
    const text = printer.printNode(ts.EmitHint.Unspecified, result, declaration.getSourceFile());
    // Disposal clears emit state, including synthetic comments on original member nodes.
    transformed.dispose();
    return text.trim();
  }

  function renderSymbol(symbol: ts.Symbol, section: string): string {
    currentSection = section;
    const canonical = names.get(symbol)!;
    const exported = (locations.get(symbol) ?? []).some(
      (location) => location.subpath === section && location.name === canonical,
    );
    if (isModuleSymbol(symbol)) {
      // Sort before allocating display names so source export order cannot change them.
      const members = checker
        .getExportsOfModule(symbol)
        .sort((a, b) => compareNames(a.name, b.name))
        .map((member) => {
          let target = names.get(normalize(member));
          if (target === undefined) {
            const reference = externalOf(member) ?? ownerReference(normalize(member));
            if (!reference) {
              throw new Error(`${pkg.name}: cannot locate the origin of ${member.name}.`);
            }
            target = externalName(reference, member.name);
          }
          return target === member.name ? target : `${target} as ${member.name}`;
        })
        .sort(compareNames);
      const keyword = exported ? "export declare namespace" : "declare namespace";
      return `${keyword} ${canonical} {\n    export { ${members.join(", ")} };\n}`;
    }
    const typeOnly = (locations.get(symbol) ?? []).some(
      (location) =>
        location.subpath === section && location.name === canonical && location.typeOnly,
    );
    return topLevelDeclarations(symbol)
      .map((declaration, index) => {
        const statement = ts.isVariableDeclaration(declaration)
          ? ts.factory.createVariableStatement(
              (declaration.parent.parent as ts.VariableStatement).modifiers,
              ts.factory.createVariableDeclarationList([declaration], declaration.parent.flags),
            )
          : (declaration as ts.Node as ts.Statement);
        const notes = index === 0 && typeOnly ? ["type-only export"] : [];
        return renderStatement(statement, declaration, canonical, exported, notes);
      })
      .join("\n");
  }

  const items: Item[] = [];
  for (const augmentation of globalAugmentations) {
    currentSection = globalSection;
    const text = renderStatement(augmentation, augmentation, "global", false, []);
    items.push({ section: globalSection, group: "code", key: text, text });
  }
  const sectionOf = (symbol: ts.Symbol): string => primary.get(symbol)?.subpath ?? helperSection;

  // What each root export name refers to, to tell "also exported" from "same name, different".
  const identities = new Map<string, unknown>();
  const externalKey = (specifier: string, name: string): string => `${specifier}\0${name}`;
  for (const [symbol, list] of locations) {
    for (const location of list) {
      if (location.subpath === rootSection) identities.set(location.name, symbol);
    }
  }
  for (const external of externalExports) {
    if (external.subpath === rootSection) {
      identities.set(external.name, externalKey(external.specifier, external.importedName));
    }
  }
  const differsFromRoot = (section: string, name: string, identity: unknown): boolean =>
    section !== rootSection && identities.has(name) && identities.get(name) !== identity;
  const ownGroup = (section: string, name: string, identity: unknown): string =>
    section === rootSection || section === helperSection
      ? "code"
      : differsFromRoot(section, name, identity)
        ? "differs"
        : "own";

  for (const symbol of [...rendered].sort((a, b) => compareNames(names.get(a)!, names.get(b)!))) {
    const section = sectionOf(symbol);
    const canonical = names.get(symbol)!;
    items.push({
      section,
      group: ownGroup(section, canonical, symbol),
      key: canonical,
      text: renderSymbol(symbol, section),
    });
  }

  // Re-export statements stay as code in the section that shows the definition. Other sections
  // list the name under "Also exported from <home>".
  const statements = new Map<string, Map<string, string[]>>();
  const addStatement = (section: string, group: string, kind: string, binding: string): void => {
    const key = `${section}\0${group}`;
    const byKind = statements.get(key) ?? new Map<string, string[]>();
    statements.set(key, byKind);
    byKind.set(kind, [...(byKind.get(kind) ?? []), binding]);
  };
  const addAlso = (
    section: string,
    home: string,
    name: string,
    shownAs: string,
    typeOnly: boolean,
    identity: unknown,
  ): void => {
    const notes = [
      ...(name === shownAs ? [] : [`shown as ${inline(shownAs)}`]),
      ...(typeOnly ? ["type only"] : []),
      ...(home !== rootSection && differsFromRoot(section, name, identity)
        ? [`differs from Export ${inline(rootSection)}`]
        : []),
    ];
    items.push({
      section,
      group: `also\0${home}`,
      key: name,
      text: `- ${inline(name)}${notes.length ? ` (${notes.join("; ")})` : ""}`,
    });
  };
  for (const [symbol, list] of locations) {
    const canonical = names.get(symbol)!;
    const home = sectionOf(symbol);
    for (const location of list) {
      if (location.name.includes(".")) continue;
      if (location.subpath === home && location.name === canonical) continue;
      if (location.subpath !== home) {
        addAlso(location.subpath, home, location.name, canonical, location.typeOnly, symbol);
        continue;
      }
      addStatement(
        home,
        ownGroup(home, location.name, symbol),
        `${location.typeOnly ? "type" : "value"}\0`,
        `${canonical} as ${location.name}`,
      );
    }
  }
  const externalHomes = new Map<string, { subpath: string; name: string }>();
  for (const external of externalExports) {
    const key = externalKey(external.specifier, external.importedName);
    if (!externalHomes.has(key) && !external.name.includes(".")) {
      externalHomes.set(key, { subpath: external.subpath, name: external.name });
    }
  }
  for (const external of externalExports) {
    if (external.name.includes(".")) continue;
    const identity = externalKey(external.specifier, external.importedName);
    const home = externalHomes.get(identity)!;
    if (external.subpath !== home.subpath) {
      addAlso(
        external.subpath,
        home.subpath,
        external.name,
        home.name,
        external.typeOnly,
        identity,
      );
      continue;
    }
    addStatement(
      external.subpath,
      ownGroup(external.subpath, external.name, identity),
      `${external.typeOnly ? "type" : "value"}\0${external.specifier}`,
      external.importedName === "*"
        ? `* as ${external.name}`
        : external.importedName === external.name
          ? external.name
          : `${external.importedName} as ${external.name}`,
    );
  }
  for (const [key, byKind] of statements) {
    const [section, group] = key.split("\0");
    const lines = [...byKind]
      .sort(([a], [b]) => compare(a, b))
      .flatMap(([kind, bindings]) => {
        const [type, from] = kind.split("\0");
        const keyword = type === "type" ? "export type" : "export";
        const target = from === "" ? undefined : from;
        const unique_ = [...new Set(bindings)].sort(compareNames);
        const stars = unique_.filter((binding) => binding.startsWith("* as "));
        const named = unique_.filter((binding) => !binding.startsWith("* as "));
        return [
          ...(named.length ? [exportList(keyword, named, target)] : []),
          ...stars.map((star) => `${keyword} ${star} from ${JSON.stringify(from)};`),
        ];
      });
    items.push({ section, group, key: "#reexports", text: lines.join("\n") });
  }

  const importLines = [...imports]
    .sort(([a], [b]) => compare(a, b))
    .flatMap(([specifier, bindings]) => {
      const lines: string[] = [];
      const named: string[] = [];
      for (const [name, display] of [...bindings].sort(([a], [b]) => compareNames(a, b))) {
        if (name === "*") lines.push(`import * as ${display} from ${JSON.stringify(specifier)};`);
        else if (name === "default")
          lines.push(`import ${display} from ${JSON.stringify(specifier)};`);
        else named.push(name === display ? name : `${name} as ${display}`);
      }
      if (named.length) lines.push(exportList("import", named, specifier));
      return lines;
    });
  if (importLines.length)
    items.push({
      section: importSection,
      group: "code",
      key: "#imports",
      text: importLines.join("\n"),
    });
  return {
    items,
    declarationCount: locations.size,
    helperCount: rendered.size - locations.size,
  };
}

function sectionTitle(section: string): string {
  if (section === importSection) return "References";
  if (section === helperSection) return "Reachable, not exported";
  if (section === globalSection) return "Global augmentations";
  return `Export ${inline(section)}`;
}

function groupRank(group: string): number {
  return group === "code" ? 0 : group === "own" ? 1 : group === "differs" ? 2 : 3;
}

function sectionItems(items: Item[], section: string): Item[] {
  return items
    .filter((item) => item.section === section)
    .sort(
      (a, b) =>
        groupRank(a.group) - groupRank(b.group) ||
        compare(a.group, b.group) ||
        Number(a.key.startsWith("#")) - Number(b.key.startsWith("#")) ||
        compareNames(a.key, b.key),
    );
}

function renderSections(items: Item[], order: string[], root: string): string[] {
  const output: string[] = [];
  for (const section of order) {
    const selected = sectionItems(items, section);
    if (selected.length === 0 && section.startsWith("#")) continue;
    output.push(`## ${sectionTitle(section)}`);
    if (section === helperSection) {
      output.push(
        "Package-local declarations that exported declarations reference, but that no export path exposes.",
      );
    }
    if (selected.length === 0) output.push(codeBlock("export {};", "ts"));
    for (const group of [...new Set(selected.map((item) => item.group))]) {
      const texts = selected.filter((item) => item.group === group).map((item) => item.text);
      if (group === "code") {
        output.push(codeBlock(texts.join("\n\n"), "ts"));
      } else if (group === "own") {
        output.push(`### Not exported from ${inline(root)}`, codeBlock(texts.join("\n\n"), "ts"));
      } else if (group === "differs") {
        output.push(
          `### Differs from ${inline(root)}`,
          `Same name as an Export ${inline(root)} export, but a different declaration.`,
          codeBlock(texts.join("\n\n"), "ts"),
        );
      } else {
        const home = group.split("\0")[1];
        output.push(
          `### Also exported from ${inline(home)}`,
          `Definitions are shown under Export ${inline(home)}.`,
          texts.join("\n"),
        );
      }
    }
  }
  return output;
}

/** Line diff of one item, keeping its first line and two lines of context around changes. */
function lineDiff(before: string[], after: string[]): string[] {
  const table = Array.from({ length: before.length + 1 }, () => new Uint32Array(after.length + 1));
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i][j] =
        before[i] === after[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const lines: string[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      lines.push(` ${before[i++]}`);
      j++;
    } else if (j >= after.length || (i < before.length && table[i + 1][j] >= table[i][j + 1])) {
      lines.push(`-${before[i++]}`);
    } else {
      lines.push(`+${after[j++]}`);
    }
  }
  const changed = lines.map((line) => !line.startsWith(" "));
  // Leading status comments and the declaration header identify the item.
  const header = lines.findIndex((line) => !line.slice(1).startsWith("//"));
  const output: string[] = [];
  let skipped = false;
  lines.forEach((line, index) => {
    const near = index <= header || changed.slice(Math.max(0, index - 2), index + 3).some(Boolean);
    if (!near) {
      skipped = true;
      return;
    }
    if (skipped) output.push("@@");
    skipped = false;
    output.push(line);
  });
  if (skipped) output.push("@@");
  return output;
}

function runtimeDifferences(base: Item[], view: Item[], order: string[]): string[] {
  const key = (item: Item): string => `${item.section}\0${item.group}\0${item.key}`;
  const baseItems = new Map(base.map((item) => [key(item), item]));
  const viewItems = new Map(view.map((item) => [key(item), item]));
  const output: string[] = [];
  for (const section of order) {
    const hunks: string[] = [];
    const baseSection = sectionItems(base, section);
    const viewSection = sectionItems(view, section);
    const keys = [...new Set([...baseSection, ...viewSection].map((item) => key(item)))].sort(
      (a, b) => compareNames(a, b),
    );
    for (const itemKey of keys) {
      const before = baseItems.get(itemKey)?.text;
      const after = viewItems.get(itemKey)?.text;
      if (before === after) continue;
      hunks.push(
        lineDiff(
          before === undefined ? [] : before.split("\n"),
          after === undefined ? [] : after.split("\n"),
        ).join("\n"),
      );
    }
    if (hunks.length === 0) continue;
    output.push(`#### ${sectionTitle(section)}`, codeBlock(hunks.join("\n\n"), "diff"));
  }
  return output;
}

const dependencyFields = [
  ["dependencies", "runtime"],
  ["peerDependencies", "peer"],
  ["optionalDependencies", "optional"],
] as const;

/**
 * The release line a range admits: its major version, or the leading zero components for 0.x.
 * Specifiers outside the simple `^`/`~`/exact forms are kept verbatim.
 */
function releaseLine(specifier: string): string {
  const match = /^[\^~]?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(specifier.trim());
  if (!match) return specifier;
  const [major, minor, patch] = match.slice(1);
  if (major !== "0") return major;
  return minor !== "0" ? `0.${minor}` : `0.0.${patch}`;
}

/**
 * Lists manifest dependencies with verbatim specifiers. The hashed form replaces each specifier
 * with its release line, so only added, removed, or major-changed dependencies need re-review.
 */
function dependencySection(
  manifest: Record<string, unknown>,
): { display: string[]; hashed: string[] } | undefined {
  const rows: Array<{ name: string; specifier: string; kind: string }> = [];
  for (const [field, kind] of dependencyFields) {
    const value = manifest[field];
    if (value === undefined) continue;
    if (!isRecord(value)) throw new Error(`Expected an object for package.json ${field}.`);
    for (const name of Object.keys(value).sort(compare)) {
      rows.push({ name, specifier: requiredString(value[name], `${field}.${name}`), kind });
    }
  }
  if (rows.length === 0) return undefined;
  const heading = [
    "## Dependencies",
    "Specifiers are verbatim from package.json. The review hash covers dependency names and major versions only.",
  ];
  const table = (version: (specifier: string) => string): string =>
    [
      "| Package | Version | Type |",
      "| --- | --- | --- |",
      ...rows.map(
        (row) => `| ${inline(row.name)} | ${inline(version(row.specifier))} | ${row.kind} |`,
      ),
    ].join("\n");
  return {
    display: [...heading, table((specifier) => specifier)],
    hashed: [...heading, table(releaseLine)],
  };
}

/** Generate a review of the ESM public surface, with other runtime conditions as differences. */
export function generateApiReview(packageRoot: string): ApiReview {
  const root = realpathSync(packageRoot);
  const manifest = readManifest(path.join(root, "package.json"));
  const name = requiredString(manifest.name, "package name");
  const version = requiredString(manifest.version, "package version");
  const entries = entriesFromManifest(manifest);
  const ownerCache = new Map<string, string | undefined>();
  const owner = (file: string): string | undefined => {
    const directory = path.dirname(file);
    if (ownerCache.has(directory)) return ownerCache.get(directory);
    const manifestPath = path.join(directory, "package.json");
    const nested = existsSync(manifestPath) ? readManifest(manifestPath) : undefined;
    // Warp repeats the package identity in its per-runtime package.json shims.
    const runtimeShim =
      directory !== root &&
      contains(root, directory) &&
      !relative(root, directory).split("/").includes("node_modules") &&
      nested?.name === name &&
      nested?.version === version;
    const result =
      !runtimeShim && typeof nested?.name === "string"
        ? directory
        : directory === path.dirname(directory)
          ? undefined
          : owner(directory);
    ownerCache.set(directory, result);
    return result;
  };
  const localCache = new Map<string, boolean>();
  const isLocal = (file: string): boolean => {
    let local = localCache.get(file);
    if (local === undefined) {
      const real = realpathSync(file);
      local = contains(root, real) && owner(real) === root;
      localCache.set(file, local);
    }
    return local;
  };
  const ownerName = (file: string): string | undefined => {
    const directory = owner(realpathSync(file));
    if (!directory) return undefined;
    const value = readManifest(path.join(directory, "package.json")).name;
    return typeof value === "string" ? value : undefined;
  };
  const pkg: PackageContext = { root, name, version, entries, isLocal, ownerName };
  const declaredProfiles = profiles.filter((profile) =>
    entries.some((entry) => entry.types[profile] !== undefined),
  );
  const order = [
    importSection,
    globalSection,
    ...entries.map((entry) => entry.subpath),
    helperSection,
  ];
  const base = buildSurface(pkg, "import");
  const identical: string[] = [];
  const differences: string[] = [];
  for (const profile of declaredProfiles.filter((candidate) => candidate !== "import")) {
    const view = runtimeDifferences(base.items, buildSurface(pkg, profile).items, order);
    if (view.length === 0) identical.push(profile);
    else differences.push(`### ${inline(profile)}`, ...view);
  }
  const dependencies = dependencySection(manifest);
  const header = [
    `# API review: ${inline(name)}`,
    [
      "ESM (`import`) view.",
      'Each declaration appears under the first export path that exposes it; other paths list it under "Also exported from".',
      "Only exported declarations and the package-local declarations they reference appear.",
      "Comments are omitted except status tags.",
      "Other runtime conditions appear as differences from this view.",
    ].join(" "),
    "## Entry points",
    [
      "| Export path | Conditions |",
      "| --- | --- |",
      ...entries.map(
        (entry) => `| ${inline(entry.subpath)} | ${entry.conditions.map(inline).join(", ")} |`,
      ),
    ].join("\n"),
  ];
  const sections = [...renderSections(base.items, order, entries[0].subpath)];
  if (declaredProfiles.length > 1) {
    sections.push("## Runtime differences");
    if (identical.length) {
      sections.push(`Identical to the ESM view: ${identical.map(inline).join(", ")}.`);
    }
    sections.push(...differences);
  }
  const render = (parts: string[]): string =>
    parts.join("\n\n").replace(/\r\n/g, "\n").trimEnd() + "\n";
  const markdown = render([...header, ...(dependencies?.display ?? []), ...sections]);
  const hashInput = render([...header, ...(dependencies?.hashed ?? []), ...sections]);
  const apiMdSha256 = createHash("sha256").update(hashInput, "utf8").digest("hex");
  const metadata =
    Object.entries({
      apiMdSha256,
      packageVersion: version,
      parserVersion,
      typescriptVersion: ts.version,
    })
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n") + "\n";
  return {
    markdown,
    metadata,
    apiMdSha256,
    entryCount: entries.length,
    declarationCount: base.declarationCount,
    helperCount: base.helperCount,
    profiles: declaredProfiles,
  };
}

/** Metadata is the completion marker: a failed rerun must not leave an old usable hash. */
export function writeApiReview(packageRoot: string, outputDir: string): ApiReview {
  mkdirSync(outputDir, { recursive: true });
  const markdownPath = path.join(outputDir, "api.md");
  const metadataPath = path.join(outputDir, "api.metadata.yml");
  rmSync(metadataPath, { force: true });
  rmSync(markdownPath, { force: true });
  const review = generateApiReview(packageRoot);
  writeFileSync(markdownPath, review.markdown, "utf8");
  writeFileSync(metadataPath, review.metadata, "utf8");
  return review;
}
