// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { afterEach, assert, beforeEach, describe, it, vi } from "vitest";
import {
  platformToFilePath,
  validateKeyFile,
} from "../../../../src/credentials/managedIdentityCredential/arcMsi.js";

import fs from "node:fs";
import path from "node:path";

describe("arcMsi", function () {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("validateKeyFile", function () {
    let expectedDirectory: string;

    beforeEach(function (ctx) {
      if (process.platform !== "win32" && process.platform !== "linux") {
        // Not supported on this platform
        ctx.skip();
      }
      expectedDirectory = platformToFilePath();
    });

    it("succeeds if the file is valid", function () {
      const filePath = path.join(expectedDirectory, "file.key");
      const fileStats = new fs.Stats();
      fileStats.size = 4096;
      vi.spyOn(fs, "statSync").mockReturnValue(fileStats);
      assert.doesNotThrow(() => validateKeyFile(filePath));
    });

    it("throws if file path is empty", function () {
      assert.throws(() => validateKeyFile(""), /Failed to find/);
      assert.throws(() => validateKeyFile(undefined), /Failed to find/);
    });

    describe("on Windows", function () {
      it("throws when the file is not in the expected path", function () {
        vi.stubGlobal("process", {
          env: {
            PROGRAMDATA: "C:\\ProgramData",
          },
          platform: "win32",
        });
        assert.throws(() => validateKeyFile("C:\\Users\\user\\file.key"), /unexpected file path/);
      });

      it("throws if ProgramData is undefined", function () {
        vi.stubGlobal("process", {
          env: {},
          platform: "win32",
        });
        assert.throws(
          () => validateKeyFile("C:\\Users\\user\\file.key"),
          /PROGRAMDATA environment variable/,
        );
      });
    });

    describe("on Linux", function () {
      it("throws when the file is not in the expected path", function () {
        vi.stubGlobal("process", {
          platform: "linux",
        });
        assert.throws(() => validateKeyFile("/home/user/file.key"), /unexpected file path/);
      });
    });

    it("throws if the file extension is not .key", function () {
      const filePath = path.join(expectedDirectory, "file.pem");
      assert.throws(() => validateKeyFile(filePath), /unexpected file path/);
    });

    it("throws if the file size is invalid", function () {
      const filePath = path.join(expectedDirectory, "file.key");
      const fileStats = new fs.Stats();
      fileStats.size = 4097;
      vi.spyOn(fs, "statSync").mockReturnValue(fileStats);
      assert.throws(() => validateKeyFile(filePath), /larger than expected/);
    });
  });
});
