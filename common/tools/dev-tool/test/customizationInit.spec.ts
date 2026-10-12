// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initializeCustomization } from "../src/commands/customization/init.ts";

const fixtures: string[] = [];

async function write(directory: string, relative: string, contents: string): Promise<void> {
  const file = path.join(directory, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents);
}

async function read(directory: string, relative: string): Promise<string> {
  return fs.readFile(path.join(directory, relative), "utf8");
}

async function createFixture(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "azsdk-customization-init-test-"));
  fixtures.push(directory);
  await write(
    directory,
    "package.json",
    JSON.stringify({
      name: "@azure/customization-init-fixture",
      type: "module",
      version: "1.0.0",
      exports: {
        "./package.json": "./package.json",
        ".": { import: "./dist/esm/index.js" },
        "./api": { import: "./dist/esm/api/index.js" },
        "./models": { import: "./dist/esm/models/index.js" },
      },
      imports: {
        "#platform/*": {
          browser: "./src/*-browser.mts",
          default: "./src/*.ts",
        },
      },
      "//metadata": {
        constantPaths: [{ path: "src/client.ts", prefix: "SDK_VERSION" }],
      },
      scripts: { build: "echo build", customize: "echo custom" },
    }),
  );
  await write(
    directory,
    "warp.config.json",
    JSON.stringify({
      exports: {
        "./package.json": "./package.json",
        ".": "./src/index.ts",
        "./api": "./src/api/index.ts",
        "./models": "./src/models/index.ts",
      },
      targets: [{ name: "esm", tsconfig: "./config/tsconfig.src.json" }],
    }),
  );
  await write(
    directory,
    "src/index.ts",
    'export { Client } from "./client.js";\nexport type { Model } from "./models/index.js";\n',
  );
  await write(
    directory,
    "src/client.ts",
    'import pkg from "../package.json" with { type: "json" };\nimport { send } from "./api/operations.js";\nexport class Client { version = pkg.version; send = send; }\n',
  );
  await write(directory, "src/api/index.ts", 'export { send } from "./operations.js";\n');
  await write(directory, "src/api/operations.ts", "export function send() { return 42; }\n");
  await write(directory, "src/models/index.ts", "export interface Model { name: string; }\n");
  await write(directory, "src/platform.ts", 'export const platform = "node";\n');
  await write(directory, "src/platform-browser.mts", 'export const platform = "browser";\n');
  await write(
    directory,
    "test/reference.ts",
    'import { Client } from "../src/client.js";\nimport { send } from "../src/api/index.js";\nexport { Client, send };\n',
  );
  await write(
    directory,
    "config/tsconfig.src.json",
    `{
      // Keep this comment.
      "compilerOptions": {
        "rootDir": "../src",
        "paths": {
          "@azure/customization-init-fixture": ["../src/index.ts"],
          "$internal/*": ["../src/*"]
        }
      },
      "files": ["../src/client.ts", "../src/api/index.ts"],
      "include": ["../src/**/*"]
    }`,
  );
  return directory;
}

afterEach(async () => {
  vi.restoreAllMocks();
  for (const directory of fixtures.splice(0)) {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

describe("customization init generated-subdirectory layout", () => {
  it("preserves public barrels, compiled exports, and generated internal imports", async () => {
    const directory = await createFixture();
    const originalManifest = JSON.parse(await read(directory, "package.json"));
    const originalConfig = await read(directory, "warp.config.json");
    const originalRoot = await read(directory, "src/index.ts");
    const originalApi = await read(directory, "src/api/index.ts");
    const originalOperations = await read(directory, "src/api/operations.ts");

    await expect(initializeCustomization(directory)).resolves.toBe(true);

    expect(await read(directory, "src/index.ts")).toContain(
      'export * from "./generated/index.js";',
    );
    expect(await read(directory, "src/api/index.ts")).toContain(
      'export * from "../generated/api/index.js";',
    );
    expect(await read(directory, "src/models/index.ts")).toContain(
      'export * from "../generated/models/index.js";',
    );
    expect(await read(directory, "src/generated/index.ts")).toBe(originalRoot);
    expect(await read(directory, "src/generated/api/index.ts")).toBe(originalApi);
    expect(await read(directory, "src/generated/api/operations.ts")).toBe(originalOperations);
    expect(await read(directory, "src/generated/client.ts")).toContain(
      'from "./api/operations.js"',
    );
    expect(await read(directory, "src/generated/client.ts")).toContain('from "../../package.json"');
    await expect(fs.stat(path.join(directory, "src/client.ts"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(JSON.parse(await read(directory, "package.json")).exports).toEqual(
      originalManifest.exports,
    );
    expect(await read(directory, "warp.config.json")).toBe(originalConfig);
  });

  it("updates private aliases, version constants, and direct internal test references", async () => {
    const directory = await createFixture();

    await initializeCustomization(directory);

    const manifest = JSON.parse(await read(directory, "package.json"));
    expect(manifest.imports["#platform/*"]).toEqual({
      browser: "./src/generated/*-browser.mts",
      default: "./src/generated/*.ts",
    });
    expect(manifest["//metadata"].constantPaths[0].path).toBe("src/generated/client.ts");
    expect(manifest.scripts.customize).toBe("echo custom");
    const test = await read(directory, "test/reference.ts");
    expect(test).toContain('from "../src/generated/client.js"');
    expect(test).toContain('from "../src/api/index.js"');
    const config = await read(directory, "config/tsconfig.src.json");
    expect(config).toContain("// Keep this comment.");
    expect(config).toContain('"rootDir": "../src"');
    expect(config).toContain('"$internal/*": ["../src/generated/*"]');
    expect(config).toContain('"@azure/customization-init-fixture": ["../src/index.ts"]');
    expect(ts.parseConfigFileTextToJson("tsconfig.json", config).config.files).toEqual([
      "../src/generated/client.ts",
      "../src/api/index.ts",
      "../src/index.ts",
      "../src/models/index.ts",
    ]);
    expect(config).toContain('"include": ["../src/**/*"]');
  });

  it("adds every public barrel as a compiler root even when only the root index was included", async () => {
    const directory = await createFixture();
    await write(
      directory,
      "config/tsconfig.src.json",
      JSON.stringify({ include: ["../src/index.ts"] }),
    );

    await initializeCustomization(directory);

    const config = JSON.parse(await read(directory, "config/tsconfig.src.json"));
    expect(config.include).toEqual(["../src/index.ts"]);
    expect(config.files).toEqual([
      "../src/index.ts",
      "../src/api/index.ts",
      "../src/models/index.ts",
    ]);
  });

  it.each(["{}", '{"include": ["../src/index.ts"],\n// Preserve this trailing comment.\n}'])(
    "adds compiler roots to an empty or trailing-comma configuration: %s",
    async (content) => {
      const directory = await createFixture();
      await write(directory, "config/tsconfig.src.json", content);

      await initializeCustomization(directory);

      const config = ts.parseConfigFileTextToJson(
        "tsconfig.json",
        await read(directory, "config/tsconfig.src.json"),
      );
      expect(config.error).toBeUndefined();
      expect(config.config.files).toEqual([
        "../src/index.ts",
        "../src/api/index.ts",
        "../src/models/index.ts",
      ]);
    },
  );

  it("adds a no-op customize script only when no script is present", async () => {
    const directory = await createFixture();
    const manifest = JSON.parse(await read(directory, "package.json"));
    delete manifest.scripts.customize;
    await write(directory, "package.json", JSON.stringify(manifest));

    await initializeCustomization(directory);

    expect(JSON.parse(await read(directory, "package.json")).scripts.customize).toBe(
      "echo skipped",
    );
  });

  it("preserves an explicitly empty customize script", async () => {
    const directory = await createFixture();
    const manifest = JSON.parse(await read(directory, "package.json"));
    manifest.scripts.customize = "";
    await write(directory, "package.json", JSON.stringify(manifest));

    await initializeCustomization(directory);

    expect(JSON.parse(await read(directory, "package.json")).scripts.customize).toBe("");
  });

  it("is idempotent and does not overwrite handwritten barrel changes", async () => {
    const directory = await createFixture();
    await initializeCustomization(directory);
    await write(directory, "src/index.ts", 'export const customization = "keep";\n');
    const manifest = await read(directory, "package.json");
    const generated = await read(directory, "src/generated/client.ts");

    await expect(initializeCustomization(directory)).resolves.toBe(true);

    expect(await read(directory, "src/index.ts")).toBe('export const customization = "keep";\n');
    expect(await read(directory, "package.json")).toBe(manifest);
    expect(await read(directory, "src/generated/client.ts")).toBe(generated);
  });

  it("rejects legacy merge layouts before changing source", async () => {
    const directory = await createFixture();
    await write(directory, "generated/index.ts", "export const baseline = 1;\n");
    const source = await read(directory, "src/index.ts");
    const manifest = await read(directory, "package.json");

    await expect(initializeCustomization(directory)).rejects.toThrow(/root generated/);

    expect(await read(directory, "src/index.ts")).toBe(source);
    expect(await read(directory, "package.json")).toBe(manifest);
  });

  it("rejects a non-directory generated location without reporting initialization success", async () => {
    const directory = await createFixture();
    await write(directory, "src/generated", "not a directory");
    const source = await read(directory, "src/index.ts");

    await expect(initializeCustomization(directory)).rejects.toThrow(
      /Generated source location is not a directory/,
    );

    expect(await read(directory, "src/index.ts")).toBe(source);
    expect(await read(directory, "src/generated")).toBe("not a directory");
  });

  it("rejects wildcard exports and leaves the package untouched", async () => {
    const directory = await createFixture();
    const config = JSON.parse(await read(directory, "warp.config.json"));
    config.exports["./api/*"] = "./src/api/*.ts";
    await write(directory, "warp.config.json", JSON.stringify(config));
    const source = await read(directory, "src/index.ts");

    await expect(initializeCustomization(directory)).rejects.toThrow(/wildcard/i);

    expect(await read(directory, "src/index.ts")).toBe(source);
    await expect(fs.stat(path.join(directory, "src/generated"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rejects missing public source mappings before changing files", async () => {
    const directory = await createFixture();
    const manifest = JSON.parse(await read(directory, "package.json"));
    manifest.exports["./missing"] = { import: "./dist/esm/missing.js" };
    await write(directory, "package.json", JSON.stringify(manifest));
    const source = await read(directory, "src/index.ts");

    await expect(initializeCustomization(directory)).rejects.toThrow(
      /Public export has no Warp source mapping/,
    );

    expect(await read(directory, "src/index.ts")).toBe(source);
  });

  it("forwards default exports from implementation entry points", async () => {
    const directory = await createFixture();
    const config = JSON.parse(await read(directory, "warp.config.json"));
    config.exports["./client"] = "./src/client.ts";
    await write(directory, "warp.config.json", JSON.stringify(config));
    const manifest = JSON.parse(await read(directory, "package.json"));
    manifest.exports["./client"] = { import: "./dist/esm/client.js" };
    await write(directory, "package.json", JSON.stringify(manifest));
    await write(
      directory,
      "src/client.ts",
      "export class Client {}\nexport default class DefaultClient {}\n",
    );

    await initializeCustomization(directory);

    const barrel = await read(directory, "src/client.ts");
    expect(barrel).toContain('export * from "./generated/client.js";');
    expect(barrel).toContain('export { default } from "./generated/client.js";');
  });

  it("updates static dynamic imports, import types, require calls, and package assets", async () => {
    const directory = await createFixture();
    await write(
      directory,
      "src/references.ts",
      `/// <reference path="../shared.d.ts" />
import type { Model } from "./models/index.js";
export type PackageInfo = typeof import("../package.json");
export const load = () => import("../external.js");
export const legacy = () => require("../external.js");
export const asset = new URL("../assets/example.txt", import.meta.url);
`,
    );
    await write(directory, "shared.d.ts", "export {};\n");

    await initializeCustomization(directory);

    const generated = await read(directory, "src/generated/references.ts");
    expect(generated).toContain('path="../../shared.d.ts"');
    expect(generated).toContain('from "./models/index.js"');
    expect(generated).toContain('import("../../package.json")');
    expect(generated).toContain('import("../../external.js")');
    expect(generated).toContain('require("../../external.js")');
    expect(generated).toContain('new URL("../../assets/example.txt", import.meta.url)');
  });

  it("restores the source and metadata if installation fails", async () => {
    const directory = await createFixture();
    const source = await read(directory, "src/index.ts");
    const manifest = await read(directory, "package.json");
    const test = await read(directory, "test/reference.ts");
    const config = await read(directory, "config/tsconfig.src.json");
    const originalWriteFile = fs.writeFile;
    let fail = true;
    vi.spyOn(fs, "writeFile").mockImplementation(async (...args) => {
      if (args[0] === path.join(directory, "package.json") && fail) {
        fail = false;
        throw new Error("simulated manifest write failure");
      }
      return originalWriteFile(...args);
    });

    await expect(initializeCustomization(directory)).rejects.toThrow(
      /simulated manifest write failure/,
    );

    expect(await read(directory, "src/index.ts")).toBe(source);
    expect(await read(directory, "package.json")).toBe(manifest);
    expect(await read(directory, "test/reference.ts")).toBe(test);
    expect(await read(directory, "config/tsconfig.src.json")).toBe(config);
    await expect(fs.stat(path.join(directory, "src/generated"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});
