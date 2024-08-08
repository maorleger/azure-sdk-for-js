// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup.js";
import { Recorder, env } from "@azure-tools/test-recorder";
import { ClientSecretCredential } from "../../../src/index.js";
import { describe, it, assert, expect, vi, beforeEach, afterEach } from "vitest";

describe("AuthorityValidation", function () {
  let cleanup: MsalTestCleanup;
  let recorder: Recorder;
  beforeEach(async (ctx) => {
    const setup = await msalNodeTestSetup(ctx);
    cleanup = setup.cleanup;
    recorder = setup.recorder;
  });

  afterEach(async function () {
    await cleanup();
  });

  const scope = "https://vault.azure.net/.default";

  it("disabled and authenticates", async function () {
    const credential = new ClientSecretCredential(
      env.AZURE_TENANT_ID!,
      env.AZURE_CLIENT_ID!,
      env.AZURE_CLIENT_SECRET!,
      recorder.configureClientOptions({ disableInstanceDiscovery: true }),
    );

    const token = await credential.getToken(scope);
    assert.ok(token?.token);
    assert.isNotNaN(token?.expiresOnTimestamp);
    assert.isNotNull(token?.expiresOnTimestamp);
    assert.ok(token?.expiresOnTimestamp > Date.now());
  });
});
