// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-namespace */

import {
  InteractiveBrowserCredential,
  InteractiveBrowserCredentialNodeOptions,
} from "../../../src";
import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup";
import { Recorder, env } from "@azure-tools/test-recorder";
import { TestContext, afterEach, beforeEach, describe, expect, it } from "vitest";

import { BrowserConfigurationAuthError } from "@azure/msal-browser";
import Sinon from "sinon";
import http from "http";
import { interactiveBrowserMockable } from "../../../src/msal/nodeFlows/msalOpenBrowser";

declare global {
  namespace NodeJS {
    interface Global {
      URL: typeof import("url").URL;
    }
  }
}

describe("InteractiveBrowserCredential (internal)", function () {
  let cleanup: MsalTestCleanup;
  let sandbox: Sinon.SinonSandbox;
  let listen: http.Server | undefined;
  let recorder: Recorder;

  beforeEach(async function (ctx: TestContext) {
    const setup = await msalNodeTestSetup(ctx);
    sandbox = setup.sandbox;
    cleanup = setup.cleanup;
    recorder = setup.recorder;
  });
  afterEach(async function () {
    if (listen) {
      listen.close();
    }
    await cleanup();
  });

  const scope = "https://vault.azure.net/.default";

  // TODO: re-enable this when we resolve the esm incompatibility issues
  // https://github.com/Azure/azure-sdk-for-js/issues/28373
  it("Throws an expected error if no browser is available", async function () {
    // The SinonStub type does not include this second parameter to throws().
    const testErrorMessage = "No browsers available on this test.";
    (sandbox.stub(interactiveBrowserMockable, "open") as any).throws(
      "BrowserConfigurationAuthError",
      testErrorMessage,
    );

    const credential = new InteractiveBrowserCredential(
      recorder.configureClientOptions({
        redirectUri: "http://localhost:8081",
        tenantId: env.AZURE_TENANT_ID,
        clientId: env.AZURE_CLIENT_ID,
      } as InteractiveBrowserCredentialNodeOptions),
    );

    await expect(credential.getToken(scope)).rejects.toThrowError(
      new BrowserConfigurationAuthError("No browsers available on this test."),
    );
  });
});
