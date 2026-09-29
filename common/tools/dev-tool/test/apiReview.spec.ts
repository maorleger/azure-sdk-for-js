// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { generateApiReview, writeApiReview } from "../src/util/apiReview.ts";
import generateCommand from "../src/commands/run/generate-api-review.ts";
import { updateBackend } from "../src/util/printer.ts";

const directories: string[] = [];
const name = "@example/review";
const version = "1.0.0";
const importExport = { import: { types: "./dist/esm/index.d.ts", default: "./dist/esm/index.js" } };

function write(root: string, file: string, text: string): void {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

function fixture(
  files: Record<string, string> = {},
  overrides: Record<string, unknown> = {},
): string {
  const root = mkdtempSync(path.join(tmpdir(), "api-review-"));
  directories.push(root);
  write(
    root,
    "package.json",
    JSON.stringify({
      name,
      version,
      type: "module",
      exports: { ".": importExport },
      ...overrides,
    }),
  );
  write(root, "dist/esm/index.d.ts", "export declare const value: string;\n");
  for (const [file, text] of Object.entries(files)) write(root, file, text);
  return root;
}

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
  updateBackend({ error: console.error, info: console.info });
});

function section(markdown: string, title: string): string {
  const start = markdown.indexOf(`## ${title}\n`);
  if (start < 0) throw new Error(`Missing section ${title}`);
  const end = markdown.indexOf("\n## ", start + 1);
  return markdown.slice(start, end < 0 ? undefined : end);
}

function writeDependency(root: string, dependency: string, text: string): void {
  write(
    root,
    `node_modules/${dependency}/package.json`,
    JSON.stringify({ name: dependency, version, type: "module", types: "./index.d.ts" }),
  );
  write(root, `node_modules/${dependency}/index.d.ts`, text);
}

describe("generateApiReview", () => {
  it("renders aliases, helpers, cycles, overloads, namespaces, tags, and defaults by public name", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        'export { Client as Widget } from "./client.js";',
        'export type { Result as PublicResult } from "./first.js";',
        'export * from "./second.js";',
        'export * as model from "./first.js";',
        "export default function create(): void;",
      ].join("\n"),
      "dist/esm/client.d.ts": [
        'import type { Result } from "./first.js";',
        "/** @beta */",
        "export class Client {",
        "  private brand;",
        "  read(): Result;",
        "  read(id: string): Promise<Result>;",
        "}",
        "/** @internal */",
        "export interface InternalSibling { hidden: boolean }",
      ].join("\n"),
      "dist/esm/first.d.ts":
        'import type { Other } from "./second.js";\nexport interface Result { next?: Other }\n',
      "dist/esm/second.d.ts":
        'import type { Result as First } from "./first.js";\ninterface Result { value: number }\nexport interface Other { first?: First; result: Result }\nexport {};\n',
    });
    const review = generateApiReview(root);
    const root_ = section(review.markdown, "Export `.`");
    expect(review.entryCount).toBe(1);
    expect(review.declarationCount).toBe(5);
    expect(review.helperCount).toBe(1);
    expect(root_).toContain("// @beta\nexport class Widget {");
    expect(root_).toContain("read(): PublicResult;");
    expect(root_).toContain("read(id: string): Promise<PublicResult>;");
    expect(root_).toContain("export interface PublicResult {\n    next?: Other;\n}");
    expect(root_).toContain(
      "export interface Other {\n    first?: PublicResult;\n    result: Result;\n}",
    );
    expect(root_).toContain(
      "export declare namespace model {\n    export { PublicResult as Result };\n}",
    );
    expect(root_).toContain("\ndeclare function create(): void;");
    expect(root_).not.toContain("export declare function create");
    expect(root_).toContain("export { create as default };");
    expect(section(review.markdown, "Reachable, not exported")).toContain(
      "interface Result {\n    value: number;\n}",
    );
    expect(review.markdown).not.toContain("InternalSibling");
    expect(review.markdown).not.toContain("brand");
    expect(review.markdown).not.toContain("./first.js");
  });

  it("omits unreachable module siblings and keeps reachable unexported declarations", () => {
    const root = fixture({
      "dist/esm/index.d.ts": 'export { Client } from "./client.js";',
      "dist/esm/client.d.ts": [
        'import type { Options } from "./models.js";',
        "export class Client { constructor(options: Options); }",
      ].join("\n"),
      "dist/esm/models.d.ts": [
        "export interface Options { retry: RetryOptions }",
        "export interface RetryOptions { count: number }",
        "export declare function optionsSerializer(item: Options): unknown;",
        'export declare const LATEST_API_VERSION = "2026-01-01";',
      ].join("\n"),
    });
    const review = generateApiReview(root);
    const helpers = section(review.markdown, "Reachable, not exported");
    expect(helpers).toContain("interface Options {\n    retry: RetryOptions;\n}");
    expect(helpers).toContain("interface RetryOptions {");
    expect(helpers).not.toContain("export interface");
    expect(review.markdown).not.toContain("optionsSerializer");
    expect(review.markdown).not.toContain("LATEST_API_VERSION");
    expect(review.helperCount).toBe(2);
  });

  it("uses canonical public names for references through local import aliases", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        'export type { JsonWebKeyType as KeyType } from "./models.js";',
        'export * from "./client.js";',
      ].join("\n"),
      "dist/esm/models.d.ts": "export type JsonWebKeyType = string;",
      "dist/esm/client.d.ts": [
        'import type { JsonWebKeyType as Kind } from "./models.js";',
        'import type * as models from "./models.js";',
        'export interface Options { kind: Kind; other: models.JsonWebKeyType; lazy: import("./models.js").JsonWebKeyType }',
      ].join("\n"),
    });
    const text = section(generateApiReview(root).markdown, "Export `.`");
    expect(text).toContain("export type KeyType = string;");
    expect(text).toContain("kind: KeyType;");
    expect(text).toContain("other: KeyType;");
    expect(text).toContain("lazy: KeyType;");
    expect(text).not.toContain("JsonWebKeyType");
    expect(text).not.toContain("Kind");
  });

  it("disambiguates same-named reachable helpers from different modules", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        'export { First } from "./a.js";',
        'export { Second } from "./b.js";',
      ].join("\n"),
      "dist/esm/a.d.ts":
        "interface Result { a: string }\nexport interface First { value: Result }\nexport {};",
      "dist/esm/b.d.ts":
        "interface Result { b: number }\nexport interface Second { value: Result }\nexport {};",
    });
    const markdown = generateApiReview(root).markdown;
    const helpers = section(markdown, "Reachable, not exported");
    expect(helpers).toContain("interface Result {\n    a: string;\n}");
    expect(helpers).toContain("interface Result_2 {\n    b: number;\n}");
    expect(markdown).toContain("export interface First {\n    value: Result;\n}");
    expect(markdown).toContain("export interface Second {\n    value: Result_2;\n}");
  });

  it("does not change the review when declarations move between files", () => {
    const first = fixture({
      "dist/esm/index.d.ts": 'export * from "./models.js";\nexport * from "./client.js";',
      "dist/esm/models.d.ts": "export interface Options { id: string }",
      "dist/esm/client.d.ts":
        'import type { Options } from "./models.js";\nexport class Client { get(options: Options): void; }',
    });
    const second = fixture({
      "dist/esm/index.d.ts": 'export * from "./api/everything.js";',
      "dist/esm/api/everything.d.ts":
        "export class Client { get(options: Options): void; }\nexport interface Options { id: string }",
    });
    const a = generateApiReview(first);
    const b = generateApiReview(second);
    expect(a.markdown).toBe(b.markdown);
    expect(a.apiMdSha256).toBe(b.apiMdSha256);
  });

  it("lists external references as imports, including namespace-qualified names", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        'import type * as core from "dep";',
        'import type { Credential as TokenCredential } from "dep";',
        "export interface Options extends core.Base { other: core.Other; credential: TokenCredential; when: Date }",
        'export type { Other as ReexportedOther } from "dep";',
      ].join("\n"),
    });
    writeDependency(
      root,
      "dep",
      "export interface Base { id: string }\nexport interface Other { x: number }\nexport interface Credential { token: string }",
    );
    const markdown = generateApiReview(root).markdown;
    expect(section(markdown, "References")).toContain(
      'import {\n    Base,\n    Credential,\n    Other,\n} from "dep";',
    );
    expect(markdown).toContain(
      "export interface Options extends Base {\n    other: Other;\n    credential: Credential;\n    when: Date;\n}",
    );
    expect(markdown).toContain('export { Other as ReexportedOther } from "dep";');
    expect(markdown).not.toContain("Base {\n    id");
  });

  it("keeps the origin of external members of a namespace export", () => {
    const review = (dependency: string) => {
      const root = fixture({
        "dist/esm/index.d.ts": 'export * as ns from "./wrapper.js";',
        "dist/esm/wrapper.d.ts": `export { Foo } from "${dependency}";`,
      });
      writeDependency(root, dependency, "export interface Foo { id: string }");
      return generateApiReview(root);
    };
    const first = review("dep-a");
    expect(first.markdown).toContain('import { Foo } from "dep-a";');
    expect(first.markdown).toContain("export declare namespace ns {\n    export { Foo };\n}");
    expect(review("dep-b").apiMdSha256).not.toBe(first.apiMdSha256);
  });

  it("allocates namespace member import names independently of source order", () => {
    const review = (lines: string[]) => {
      const root = fixture({
        "dist/esm/index.d.ts": 'export * as ns from "./wrapper.js";',
        "dist/esm/wrapper.d.ts": lines.join("\n"),
      });
      writeDependency(root, "dep-a", "export interface Foo { a: string }");
      writeDependency(root, "dep-b", "export interface Foo { b: string }");
      return generateApiReview(root).markdown;
    };
    const lines = ['export { Foo as A } from "dep-a";', 'export { Foo as B } from "dep-b";'];
    expect(review(lines)).toBe(review([...lines].reverse()));
  });

  it("assigns helper name suffixes independently of file layout", () => {
    const layout = (firstHelper: string, secondHelper: string) =>
      generateApiReview(
        fixture({
          "dist/esm/index.d.ts":
            'export { First } from "./first.js";\nexport { Second } from "./second.js";',
          "dist/esm/first.d.ts": `import type { Result } from "./${firstHelper}.js";\nexport interface First { value: Result }`,
          "dist/esm/second.d.ts": `import type { Result } from "./${secondHelper}.js";\nexport interface Second { value: Result }`,
          [`dist/esm/${firstHelper}.d.ts`]: "export interface Result { a: string }",
          [`dist/esm/${secondHelper}.d.ts`]: "export interface Result { b: number }",
        }),
      );
    const a = layout("z", "a");
    const b = layout("a", "z");
    expect(a.markdown).toBe(b.markdown);
    expect(a.markdown).toContain("export interface First {\n    value: Result;\n}");
    expect(a.markdown).toContain("export interface Second {\n    value: Result_2;\n}");
  });

  it("rejects package-local import types that have no named member", () => {
    const root = fixture({
      "dist/esm/index.d.ts": 'export type Registry = typeof import("./a.js");',
      "dist/esm/a.d.ts": "export declare const value: string;",
    });
    expect(() => generateApiReview(root)).toThrow("Unsupported import type");
  });

  it("rejects namespace-qualified names that the dependency does not export", () => {
    const root = fixture({
      "dist/esm/index.d.ts":
        'import type * as dep from "dep";\nexport interface X { value: dep.Missing }',
    });
    writeDependency(root, "dep", "export interface Present { id: string }");
    expect(() => generateApiReview(root)).toThrow("cannot resolve dep.Missing");
  });

  it("rejects unresolved import-equals, type reference, and path reference directives", () => {
    const cases = [
      'import missing = require("not-installed");\nexport interface X { value: missing.Value }',
      '/// <reference types="not-installed" />\nexport interface X { value: MissingGlobal }',
      '/// <reference path="./missing.d.ts" />\nexport interface X { value: string }',
    ];
    const messages = [
      "Cannot find module 'not-installed'",
      "type reference directive",
      "referenced file",
    ];
    cases.forEach((text, index) => {
      expect(() => generateApiReview(fixture({ "dist/esm/index.d.ts": text }))).toThrow(
        messages[index],
      );
    });
  });

  it("keeps private constructors, omits other private members, and drops class declare", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        "export declare class Singleton {",
        "  #private;",
        "  private constructor();",
        "  private cache;",
        "  protected refresh(): void;",
        "  static create(): Singleton;",
        "}",
      ].join("\n"),
    });
    const text = generateApiReview(root).markdown;
    expect(text).toContain("export class Singleton {");
    expect(text).toContain("private constructor();");
    expect(text).toContain("protected refresh(): void;");
    expect(text).not.toContain("#private");
    expect(text).not.toContain("cache");
    expect(text).not.toContain("declare class");
    expect(text).not.toContain("private members omitted");
  });

  it(
    "reports runtime views as differences from ESM and keeps dependencies external",
    { timeout: 20_000 },
    () => {
      const profiles = {
        browser: { types: "./dist/browser/index.d.ts", default: "./dist/browser/index.js" },
        ...importExport,
        require: { types: "./dist/commonjs/index.d.ts", default: "./dist/commonjs/index.js" },
      };
      const root = fixture({}, { exports: { ".": profiles } });
      const external: Record<string, object> = {};
      for (const [profile, target] of Object.entries(profiles)) {
        write(
          root,
          target.types,
          'export * from "conditional";\nexport declare const shared: string;',
        );
        write(
          root,
          path.join(path.dirname(target.types), "package.json"),
          JSON.stringify({
            name,
            version,
            type: profile === "require" ? "commonjs" : "module",
            exports: { "./package.json": "./package.json" },
          }),
        );
        const types = `./${profile}.d.${profile === "require" ? "cts" : "mts"}`;
        external[profile] = { types };
        write(
          root,
          `node_modules/conditional/${types}`,
          `export declare const ${profile}Only: string;`,
        );
      }
      write(
        root,
        "node_modules/conditional/package.json",
        JSON.stringify({
          name: "conditional",
          version,
          type: "module",
          exports: { ".": external },
        }),
      );
      const review = generateApiReview(root);
      expect(review.profiles).toEqual(["import", "require", "browser"]);
      const esm = section(review.markdown, "Export `.`");
      expect(esm).toContain("export declare const shared: string;");
      expect(esm).toContain('export { importOnly } from "conditional";');
      expect(esm).not.toContain("browserOnly");
      const runtime = review.markdown.slice(review.markdown.indexOf("## Runtime differences"));
      expect(runtime).toContain("### `require`");
      expect(runtime).toContain("### `browser`");
      expect(runtime).toContain(
        '```diff\n-export { importOnly } from "conditional";\n+export { browserOnly } from "conditional";\n```',
      );
      expect(runtime).toContain('+export { requireOnly } from "conditional";');
      expect(runtime).not.toContain("shared");
      expect(review.markdown).not.toContain("export declare const importOnly");
    },
  );

  it(
    "states when runtime views match and hashes a runtime-only change",
    { timeout: 20_000 },
    () => {
      const profiles = {
        browser: { types: "./dist/browser/index.d.ts" },
        ...importExport,
        require: { types: "./dist/commonjs/index.d.ts" },
      };
      const declaration = "export declare function read(input: string): void;";
      const root = fixture(
        {
          "dist/esm/index.d.ts": declaration,
          "dist/browser/index.d.ts": declaration,
          "dist/commonjs/index.d.ts": declaration,
          "dist/commonjs/package.json": JSON.stringify({ name, version, type: "commonjs" }),
        },
        { exports: { ".": profiles } },
      );
      const same = generateApiReview(root);
      expect(same.markdown).toContain("Identical to the ESM view: `require`, `browser`.");
      write(root, "dist/browser/index.d.ts", "export declare function read(input: never): void;");
      const changed = generateApiReview(root);
      expect(changed.apiMdSha256).not.toBe(same.apiMdSha256);
      expect(changed.markdown).toContain("Identical to the ESM view: `require`.");
      expect(changed.markdown).toContain(
        "-export declare function read(input: string): void;\n+export declare function read(input: never): void;",
      );
    },
  );

  it(
    "shows only the changed lines of a large runtime-specific declaration",
    { timeout: 20_000 },
    () => {
      const members = Array.from({ length: 12 }, (_, index) => `  method${index}(): void;`);
      const declaration = (last: string) =>
        ["export class Client {", ...members, `  last(): ${last};`, "}"].join("\n");
      const root = fixture(
        {
          "dist/esm/index.d.ts": declaration("string"),
          "dist/browser/index.d.ts": declaration("never"),
        },
        {
          exports: {
            ".": { browser: { types: "./dist/browser/index.d.ts" }, ...importExport },
          },
        },
      );
      const runtime = generateApiReview(root).markdown.split("## Runtime differences")[1];
      expect(runtime).toContain(
        [
          " export class Client {",
          "@@",
          "     method10(): void;",
          "     method11(): void;",
          "-    last(): string;",
          "+    last(): never;",
          " }",
        ].join("\n"),
      );
      expect(runtime).not.toContain("method3");
    },
  );

  it("deduplicates the same declarations across barrels, subpaths, and renamed type-only exports", () => {
    const root = fixture(
      {
        "dist/esm/index.d.ts": 'export * from "./models.js";',
        "dist/esm/models.d.ts": [
          "export interface Model { id: string }",
          "/** @beta */",
          "export class Client {",
          "  /** @deprecated Old prose should not appear. */",
          "  old(): void;",
          "}",
        ].join("\n"),
        "dist/esm/compat.d.ts": 'export type { Client as LegacyClient } from "./models.js";',
      },
      {
        "sdk-type": "mgmt",
        exports: {
          "./package.json": "./package.json",
          ".": importExport,
          "./models": { import: { types: "./dist/esm/models.d.ts" } },
          "./compat": { import: { types: "./dist/esm/compat.d.ts" } },
        },
      },
    );
    const review = generateApiReview(root);
    expect(review.entryCount).toBe(3);
    expect(review.markdown.match(/export interface Model/g)).toHaveLength(1);
    expect(review.markdown.match(/export class Client/g)).toHaveLength(1);
    expect(section(review.markdown, "Export `.`")).toContain(
      "// @beta\nexport class Client {\n    // @deprecated\n    old(): void;\n}",
    );
    expect(section(review.markdown, "Export `./models`")).toContain(
      'export {\n    Client,\n    Model,\n} from "@example/review";',
    );
    expect(section(review.markdown, "Export `./compat`")).toContain(
      'export type { Client as LegacyClient } from "@example/review";',
    );
    expect(review.markdown).not.toContain("Old prose");
  });

  it("excludes prose comments from the review and hash while retaining status metadata", () => {
    const files = {
      "dist/esm/index.d.ts": [
        "/** Docs with ```ts fences.\r\n * @deprecated Old explanation.\r\n */",
        "export interface Item {",
        " value: string;   ",
        "}",
        "//# sourceMappingURL=index.d.ts.map",
        "",
      ].join("\r\n"),
    };
    const first = generateApiReview(fixture(files));
    const second = generateApiReview(
      fixture(
        {
          "dist/esm/index.d.ts":
            "/** Different prose.\n * @deprecated New explanation.\n */\nexport interface Item { value: string; }\n",
        },
        { version: "2.0.0" },
      ),
    );
    expect(first.markdown).toBe(second.markdown);
    expect(first.apiMdSha256).toBe(second.apiMdSha256);
    expect(first.markdown).not.toContain("\r");
    expect(first.markdown).not.toContain("sourceMappingURL");
    expect(first.markdown).not.toContain("Docs");
    expect(first.markdown).not.toContain("explanation");
    expect(first.markdown).not.toContain("/**");
    expect(first.markdown).toContain("// @deprecated\nexport interface Item {");
    expect(first.apiMdSha256).toBe(createHash("sha256").update(first.markdown).digest("hex"));
    expect(parse(first.metadata).packageVersion).toBe("1.0.0");
    expect(parse(second.metadata).packageVersion).toBe("2.0.0");
    expect(parse(first.metadata).apiMdSha256).toBe(first.apiMdSha256);
    expect(parse(first.metadata).parserVersion).toBe("0.3.0");
  });

  it("changes the hash when an export location is removed or a signature changes", () => {
    const root = fixture(
      {
        "dist/esm/index.d.ts": 'export * from "./models.js";',
        "dist/esm/models.d.ts": "export interface Model { value: string }",
      },
      {
        exports: { ".": importExport, "./models": { import: { types: "./dist/esm/models.d.ts" } } },
      },
    );
    const original = generateApiReview(root);
    expect(section(original.markdown, "Export `./models`")).toContain(
      'export { Model } from "@example/review";',
    );
    write(root, "dist/esm/index.d.ts", "export {};");
    const removed = generateApiReview(root);
    expect(removed.apiMdSha256).not.toBe(original.apiMdSha256);
    expect(section(removed.markdown, "Export `.`")).toContain("export {};");
    expect(section(removed.markdown, "Export `./models`")).toContain("export interface Model");
    write(root, "dist/esm/models.d.ts", "export interface Model { value: number }");
    expect(generateApiReview(root).apiMdSha256).not.toBe(removed.apiMdSha256);
  }, 20_000);

  it("lists dependencies verbatim and hashes only names and release lines", () => {
    const review = (dependencies: Record<string, string>, peers: Record<string, string> = {}) =>
      generateApiReview(
        fixture(
          {},
          {
            dependencies,
            peerDependencies: peers,
            optionalDependencies: { optional: "~3.1.0" },
          },
        ),
      );
    const base = review(
      { "@azure/core-auth": "^1.9.0", tslib: "catalog:", zero: "^0.4.2", local: "workspace:^" },
      { react: ">=18 <20" },
    );
    const dependencies = section(base.markdown, "Dependencies");
    expect(dependencies).toContain("| `@azure/core-auth` | `^1.9.0` | runtime |");
    expect(dependencies).toContain("| `local` | `workspace:^` | runtime |");
    expect(dependencies).toContain("| `tslib` | `catalog:` | runtime |");
    expect(dependencies).toContain("| `react` | `>=18 <20` | peer |");
    expect(dependencies).toContain("| `optional` | `~3.1.0` | optional |");
    expect(base.markdown.indexOf("## Dependencies")).toBeLessThan(
      base.markdown.indexOf("## Export"),
    );
    expect(base.apiMdSha256).not.toBe(createHash("sha256").update(base.markdown).digest("hex"));

    const same = { tslib: "catalog:", local: "workspace:^" };
    const peers = { react: ">=18 <20" };
    const hash = (deps: Record<string, string>, p = peers) =>
      review({ ...same, ...deps }, p).apiMdSha256;
    const original = hash({ "@azure/core-auth": "^1.9.0", zero: "^0.4.2" });
    expect(original).toBe(base.apiMdSha256);
    expect(hash({ "@azure/core-auth": "^1.12.3", zero: "^0.4.9" })).toBe(original);
    expect(hash({ "@azure/core-auth": "^2.0.0", zero: "^0.4.2" })).not.toBe(original);
    expect(hash({ "@azure/core-auth": "^1.9.0", zero: "^0.5.0" })).not.toBe(original);
    expect(hash({ "@azure/core-auth": "^1.9.0", zero: "^0.4.2", added: "^1.0.0" })).not.toBe(
      original,
    );
    expect(hash({ "@azure/core-auth": "^1.9.0", zero: "^0.4.2" }, { react: ">=18 <21" })).not.toBe(
      original,
    );
  });

  it("omits the dependency section when the package has none", () => {
    const review = generateApiReview(fixture());
    expect(review.markdown).not.toContain("## Dependencies");
    expect(review.apiMdSha256).toBe(createHash("sha256").update(review.markdown).digest("hex"));
  });

  it("supports a legacy types entry without exports", () => {
    const root = fixture({}, { exports: undefined, types: "dist/esm/index.d.ts" });
    const review = generateApiReview(root);
    expect(review.entryCount).toBe(1);
    expect(review.markdown).toContain("| `.` | `types` |");
  });

  it("does not remove map-like text or significant whitespace from literal types", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        "export type Literal = `first  ",
        "//# sourceMappingURL=literal",
        "last`;",
        "//# sourceMappingURL=index.d.ts.map",
      ].join("\n"),
    });
    const review = generateApiReview(root);
    expect(review.markdown).toContain("`first  \n//# sourceMappingURL=literal\nlast`");
    expect(review.markdown).not.toContain("sourceMappingURL=index.d.ts.map");
  });

  it("allows dependency augmentations without including their declarations", () => {
    const root = fixture({ "dist/esm/index.d.ts": 'export type { Value } from "external";' });
    writeDependency(
      root,
      "external",
      "declare global { interface Window { added: string } }\nexport interface Value { id: string }",
    );
    const review = generateApiReview(root);
    expect(review.markdown).toContain('export { Value } from "external";');
    expect(review.markdown).not.toContain("added: string");
  });

  it.each([
    [{ typesVersions: {} }, "typesVersions"],
    [{ exports: { "./*": importExport } }, "Unsupported export subpath"],
    [{ exports: { ".": [importExport] } }, "Expected an import condition"],
    [
      { exports: { ".": { workerd: { types: "./dist/esm/index.d.ts" } } } },
      "Expected an import condition",
    ],
    [
      { exports: { ".": { node: { types: "./dist/esm/index.d.ts" }, ...importExport } } },
      'Unsupported condition "node"',
    ],
    [{ exports: { ".": { import: { types: "../outside.d.ts" } } } }, "package-local declaration"],
  ])("rejects unsupported manifest shapes: %j", (manifest, message) => {
    expect(() => generateApiReview(fixture({}, manifest))).toThrow(message);
  });

  it("rejects a declared browser branch shadowed by an earlier import condition", () => {
    const root = fixture(
      { "dist/browser/index.d.ts": "export declare const value: string;" },
      {
        exports: {
          ".": { ...importExport, browser: { types: "./dist/browser/index.d.ts" } },
        },
      },
    );
    expect(() => generateApiReview(root)).toThrow("condition precedence");
  });

  it("rejects conditions that cover only some export paths", () => {
    const root = fixture(
      { "dist/browser/index.d.ts": "export declare const value: string;" },
      {
        exports: {
          ".": { browser: { types: "./dist/browser/index.d.ts" }, ...importExport },
          "./extra": importExport,
        },
      },
    );
    expect(() => generateApiReview(root)).toThrow("conditions must cover every export");
  });

  it("rejects a re-export of a name that the dependency does not export", () => {
    const root = fixture({ "dist/esm/index.d.ts": 'export { Missing, Present } from "dep";' });
    writeDependency(root, "dep", "export interface Present { id: string }");
    expect(() => generateApiReview(root)).toThrow(
      "Cannot resolve imported or re-exported name 'Missing'",
    );
  });

  it("rejects missing modules and implementation-source leakage", () => {
    const root = fixture({
      "dist/esm/index.d.ts": 'export * from "./missing.js";',
    });
    expect(() => generateApiReview(root)).toThrow("Cannot find module");
    write(root, "dist/esm/missing.ts", "export const implementation = 1;");
    expect(() => generateApiReview(root)).toThrow("implementation source");
  });

  it("renders package-owned global augmentations and the declarations they reference", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        'import "./shim.js";',
        'import "./other-shim.js";',
        "export declare const value: string;",
      ].join("\n"),
      "dist/esm/other-shim.d.ts": "declare global {\n  var reviewFlag: boolean;\n}\nexport {};",
      "dist/esm/shim.d.ts": [
        'import type { Settings } from "./settings.js";',
        "declare global {",
        "  interface Window { settings: Settings }",
        "}",
      ].join("\n"),
      "dist/esm/settings.d.ts": "export interface Settings { debug: boolean }",
    });
    const markdown = generateApiReview(root).markdown;
    expect(section(markdown, "Global augmentations")).toContain(
      "declare global {\n    interface Window {\n        settings: Settings;\n    }\n}",
    );
    expect(section(markdown, "Global augmentations")).toContain(
      "declare global {\n    var reviewFlag: boolean;\n}",
    );
    const helpers = section(markdown, "Reachable, not exported");
    expect(helpers).toContain("interface Settings {");
    expect(helpers).not.toContain("global");
    expect(markdown).not.toContain("global_2");
  });

  it("rejects package-local module augmentations and export assignments", () => {
    const root = fixture({
      "dist/esm/index.d.ts":
        'export {};\ndeclare module "other" { interface Added { field: string } }',
    });
    expect(() => generateApiReview(root)).toThrow("Unsupported ModuleDeclaration");
    write(root, "dist/esm/index.d.ts", "declare const value: string;\nexport = value;");
    write(
      root,
      "package.json",
      JSON.stringify({
        name,
        version,
        type: "commonjs",
        types: "./dist/esm/index.d.ts",
      }),
    );
    expect(() => generateApiReview(root)).toThrow("Unsupported ExportAssignment");
  });

  it("does not mistake a symlinked package for owned declarations", () => {
    const external = fixture();
    const root = fixture({
      "dist/esm/index.d.ts": 'export * from "linked";',
    });
    mkdirSync(path.join(root, "node_modules"));
    symlinkSync(external, path.join(root, "node_modules/linked"), "junction");
    write(
      root,
      "package.json",
      JSON.stringify({
        name: "@example/root",
        version,
        type: "module",
        exports: { ".": importExport },
      }),
    );
    const review = generateApiReview(root);
    expect(review.declarationCount).toBe(0);
    expect(review.markdown).toContain('export { value } from "@example/review";');
    expect(review.markdown).not.toContain("export declare const value");
    expect(review.markdown).not.toContain(external);
  });

  it("distinguishes type-only star export chains, ordinary stars, and cyclic barrels", () => {
    const root = fixture(
      {
        "dist/esm/index.d.ts": 'export * from "./type-star.js";',
        "dist/esm/type-star.d.ts": 'export type * from "./models.js";',
        "dist/esm/models.d.ts": "export class Shared { value: string }",
        "dist/esm/values.d.ts": 'export * from "./cycle.js";\nexport * from "./models.js";',
        "dist/esm/cycle.d.ts": 'export * from "./values.js";',
      },
      {
        exports: { ".": importExport, "./values": { import: { types: "./dist/esm/values.d.ts" } } },
      },
    );
    const review = generateApiReview(root);
    expect(section(review.markdown, "Export `.`")).toContain(
      "// type-only export\nexport class Shared {",
    );
    expect(section(review.markdown, "Export `./values`")).toContain(
      'export { Shared } from "@example/review";',
    );
    expect(review.markdown.match(/export class Shared/g)).toHaveLength(1);
  });

  it("preserves distinct same-named declarations and groups overloads and merges", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        'export { Options as FirstOptions, run } from "./first.js";',
        'export { Options as SecondOptions } from "./second.js";',
      ].join("\n"),
      "dist/esm/first.d.ts": [
        "export interface Options { first: string }",
        "export declare function run(value: string): string;",
        "export declare function run(value: number): number;",
        "export declare namespace run { const label: string; }",
      ].join("\n"),
      "dist/esm/second.d.ts": "export interface Options { second: number }",
    });
    const markdown = generateApiReview(root).markdown;
    expect(markdown).toContain("export interface FirstOptions {\n    first: string;\n}");
    expect(markdown).toContain("export interface SecondOptions {\n    second: number;\n}");
    expect(markdown).toContain(
      [
        "export declare function run(value: string): string;",
        "export declare function run(value: number): number;",
        "export declare namespace run {",
      ].join("\n"),
    );
  });

  it("hashes API status changes without hashing their prose", () => {
    const root = fixture({
      "dist/esm/index.d.ts": "/** Some words. */\nexport class Client {}",
    });
    const before = generateApiReview(root);
    write(root, "dist/esm/index.d.ts", "/** @beta More words. */\nexport class Client {}");
    const after = generateApiReview(root);
    expect(after.apiMdSha256).not.toBe(before.apiMdSha256);
    expect(after.markdown).toContain("// @beta");
    expect(after.markdown).not.toContain("More words");
  });

  it("attaches deprecation to the affected overload, not the whole method", () => {
    const root = fixture({
      "dist/esm/index.d.ts": [
        "export class Client {",
        "  read(options: { id: string }): void;",
        "  /** @deprecated Use the options overload. */",
        "  read(id: string): void;",
        "}",
      ].join("\n"),
    });
    const markdown = generateApiReview(root).markdown;
    expect(markdown).toContain("    // @deprecated\n    read(id: string): void;");
    expect(markdown).not.toContain("// @deprecated\nexport class");
    expect(markdown).not.toContain("Use the options");
  });
});

describe("writeApiReview and command", () => {
  it("writes matching artifacts and invalidates them when a subsequent run fails", () => {
    const root = fixture();
    const output = path.join(root, "artifacts");
    const review = writeApiReview(root, output);
    expect(readFileSync(path.join(output, "api.md"), "utf8")).toBe(review.markdown);
    expect(readFileSync(path.join(output, "api.metadata.yml"), "utf8")).toBe(review.metadata);
    rmSync(path.join(root, "dist/esm/index.d.ts"));
    expect(() => writeApiReview(root, output)).toThrow("existing package-local declaration");
    expect(existsSync(path.join(output, "api.md"))).toBe(false);
    expect(existsSync(path.join(output, "api.metadata.yml"))).toBe(false);
  });

  it("uses the CLI arguments and reports failures through dev-tool", async () => {
    const error = vi.fn();
    updateBackend({ error, info: vi.fn() });
    expect(await generateCommand()).toBe(false);
    expect(error).toHaveBeenCalled();
    const root = fixture();
    const output = path.join(root, "artifacts");
    expect(await generateCommand("--package-root", root, "--output-dir", output)).toBe(true);
    expect(existsSync(path.join(output, "api.metadata.yml"))).toBe(true);
    rmSync(path.join(root, "dist/esm/index.d.ts"));
    expect(await generateCommand("--package-root", root, "--output-dir", output)).toBe(false);
    expect(existsSync(path.join(output, "api.metadata.yml"))).toBe(false);
  });
});
