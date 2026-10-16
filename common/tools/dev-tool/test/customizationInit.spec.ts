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

  it.each([
    "{}",
    '{"include":["../src/index.ts"]}',
    '{"include": ["../src/index.ts"],\n// Preserve this trailing comment.\n}',
  ])(
    "adds compiler roots to an empty, compact, or trailing-comma configuration: %s",
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

  it.each([
    '{"include":["../src/**/*.ts"]}',
    '{"include":["../src/index.ts","../src/api/index.ts","../src/models/index.ts"]}',
  ])(
    "does not rewrite a compiler configuration that already includes all public roots: %s",
    async (content) => {
      const directory = await createFixture();
      await write(directory, "config/tsconfig.src.json", content);

      await initializeCustomization(directory);

      expect(await read(directory, "config/tsconfig.src.json")).toBe(content);
    },
  );

  it("does not add a customize script when no script is present", async () => {
    const directory = await createFixture();
    const manifest = JSON.parse(await read(directory, "package.json"));
    delete manifest.scripts.customize;
    await write(directory, "package.json", JSON.stringify(manifest));

    await initializeCustomization(directory);

    expect(JSON.parse(await read(directory, "package.json")).scripts).not.toHaveProperty(
      "customize",
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

  it("fails fast on a second invocation and does not overwrite handwritten barrel changes", async () => {
    const directory = await createFixture();
    await initializeCustomization(directory);
    await write(directory, "src/index.ts", 'export const customization = "keep";\n');
    const manifest = await read(directory, "package.json");
    const generated = await read(directory, "src/generated/client.ts");

    await expect(initializeCustomization(directory)).rejects.toThrow(
      /only initializes newly generated packages/,
    );

    expect(await read(directory, "src/index.ts")).toBe('export const customization = "keep";\n');
    expect(await read(directory, "package.json")).toBe(manifest);
    expect(await read(directory, "src/generated/client.ts")).toBe(generated);
  });

  it("rejects legacy merge layouts before changing source", async () => {
    const directory = await createFixture();
    await write(directory, "generated/index.ts", "export const baseline = 1;\n");
    const source = await read(directory, "src/index.ts");
    const manifest = await read(directory, "package.json");

    await expect(initializeCustomization(directory)).rejects.toThrow(
      /only initializes newly generated packages/,
    );

    expect(await read(directory, "src/index.ts")).toBe(source);
    expect(await read(directory, "package.json")).toBe(manifest);
  });

  it("rejects any existing generated location without reporting initialization success", async () => {
    const directory = await createFixture();
    await write(directory, "src/generated", "not a directory");
    const source = await read(directory, "src/index.ts");

    await expect(initializeCustomization(directory)).rejects.toThrow(
      /only initializes newly generated packages/,
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

  it("leaves shared recursive compiler configurations untouched", async () => {
    const directory = await createFixture();
    const shared = await fs.mkdtemp(path.join(os.tmpdir(), "azsdk-shared-tsconfig-test-"));
    fixtures.push(shared);
    const sharedConfig = path.join(shared, "tsconfig.src.json");
    const content = JSON.stringify({
      compilerOptions: { rootDir: "${configDir}/src", outDir: "${configDir}/dist/esm" },
      include: ["${configDir}/src/**/*.ts"],
    });
    await fs.writeFile(sharedConfig, content);
    const config = JSON.parse(await read(directory, "warp.config.json"));
    config.targets[0].tsconfig = sharedConfig;
    await write(directory, "warp.config.json", JSON.stringify(config));

    await initializeCustomization(directory);

    expect(await fs.readFile(sharedConfig, "utf8")).toBe(content);
    expect(await read(directory, "src/api/index.ts")).toContain(
      'export * from "../generated/api/index.js";',
    );
  });

  it("fails before moving source if a shared config omits public compiler roots", async () => {
    const directory = await createFixture();
    const shared = await fs.mkdtemp(path.join(os.tmpdir(), "azsdk-shared-tsconfig-test-"));
    fixtures.push(shared);
    const sharedConfig = path.join(shared, "tsconfig.src.json");
    await fs.writeFile(sharedConfig, JSON.stringify({ include: ["${configDir}/src/index.ts"] }));
    const config = JSON.parse(await read(directory, "warp.config.json"));
    config.targets[0].tsconfig = sharedConfig;
    await write(directory, "warp.config.json", JSON.stringify(config));
    const source = await read(directory, "src/index.ts");

    await expect(initializeCustomization(directory)).rejects.toThrow(/manual localization/);

    expect(await read(directory, "src/index.ts")).toBe(source);
    await expect(fs.stat(path.join(directory, "src/generated"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rebases relative package.json imports and leaves package self-imports and other strings unchanged", async () => {
    const directory = await createFixture();
    await write(
      directory,
      "src/references.ts",
      `import pkg from "../package.json" with { type: "json" };
import self from "@azure/customization-init-fixture/package.json" with { type: "json" };
export { Model } from "./models/index.js";
export const text = "../package.json";
export const version = [pkg.version, self.version];
`,
    );

    await initializeCustomization(directory);

    const generated = await read(directory, "src/generated/references.ts");
    expect(generated).toContain('from "./models/index.js"');
    expect(generated).toContain('from "../../package.json"');
    expect(generated).toContain('from "@azure/customization-init-fixture/package.json"');
    expect(generated).toContain('text = "../package.json"');
  });

  it("updates built-output private test aliases without redirecting public package aliases", async () => {
    const directory = await createFixture();
    await write(
      directory,
      "tsconfig.browser.config.json",
      JSON.stringify({
        compilerOptions: {
          paths: {
            "@azure/customization-init-fixture/*": ["./dist/browser/*"],
            "$internal/*": ["./dist/browser/*"],
          },
        },
      }),
    );

    await initializeCustomization(directory);

    const config = JSON.parse(await read(directory, "tsconfig.browser.config.json"));
    expect(config.compilerOptions.paths["$internal/*"]).toEqual(["./dist/browser/generated/*"]);
    expect(config.compilerOptions.paths["@azure/customization-init-fixture/*"]).toEqual([
      "./dist/browser/*",
    ]);
  });

  it("propagates installation failures without a backup transaction or automatic recovery", async () => {
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

    expect(await read(directory, "src/generated/index.ts")).toBe(source);
    expect(await read(directory, "src/index.ts")).toContain(
      'export * from "./generated/index.js";',
    );
    expect(await read(directory, "package.json")).toBe(manifest);
    expect(await read(directory, "test/reference.ts")).not.toBe(test);
    expect(await read(directory, "config/tsconfig.src.json")).not.toBe(config);
    expect(
      (await fs.readdir(directory)).some((name) => name.startsWith(".customization-init-")),
    ).toBe(false);
  });
});
