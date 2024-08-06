// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DefaultAzureCredential, getBearerTokenProvider } from "../../../src/index.js";
import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup.js";
import { Recorder, delay, isPlaybackMode } from "@azure-tools/test-recorder";
import { describe, it, assert, expect, vi, beforeEach, afterEach } from "vitest";

describe("getBearerTokenProvider", function () {
  let cleanup: MsalTestCleanup;
  let recorder: Recorder;

  beforeEach(async function (ctx) {
    const setup = await msalNodeTestSetup(ctx);
    recorder = setup.recorder;
    cleanup = setup.cleanup;
  });
  afterEach(async function () {
    await cleanup();
  });

  const scope = "https://vault.azure.net/.default";

  it("returns a callback that returns string tokens", async function () {
    const credential = new DefaultAzureCredential(recorder.configureClientOptions({}));

    const getAccessToken = getBearerTokenProvider(credential, scope);

    for (let i = 0; i < 5; i++) {
      if (!isPlaybackMode()) {
        await delay(500);
      }
      const token = await getAccessToken();
      assert.isString(token);
    }
  });
});
