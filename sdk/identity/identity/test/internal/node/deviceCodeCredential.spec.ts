// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup";
import { Recorder, env, isLiveMode } from "@azure-tools/test-recorder";
import { TestContext, afterEach, beforeEach, describe, expect, it } from "vitest";

import { DeviceCodeCredential } from "../../../src";
import { GetTokenOptions } from "@azure/core-auth";
import { MsalNode } from "../../../src/msal/nodeFlows/msalNodeCommon";
import { PublicClientApplication } from "@azure/msal-node";
import Sinon from "sinon";

describe("DeviceCodeCredential (internal)", function () {
  let cleanup: MsalTestCleanup;
  let getTokenSilentSpy: Sinon.SinonSpy;
  let doGetTokenSpy: Sinon.SinonSpy;
  let recorder: Recorder;

  beforeEach(async function (ctx: TestContext) {
    const setup = await msalNodeTestSetup(ctx);
    cleanup = setup.cleanup;
    recorder = setup.recorder;

    getTokenSilentSpy = setup.sandbox.spy(MsalNode.prototype, "getTokenSilent");

    // MsalClientSecret calls to this method underneath.
    doGetTokenSpy = setup.sandbox.spy(
      PublicClientApplication.prototype,
      "acquireTokenByDeviceCode",
    );
  });

  afterEach(async function () {
    await cleanup();
  });

  const scope = "https://vault.azure.net/.default";

  // These tests should not run live because this credential requires user interaction.
  it.skipIf(isLiveMode())("Authenticates silently after the initial request", async function () {
    const credential = new DeviceCodeCredential(
      recorder.configureClientOptions({
        tenantId: env.AZURE_TENANT_ID,
        clientId: env.AZURE_CLIENT_ID,
      }),
    );

    await credential.getToken(scope);
    expect(getTokenSilentSpy.callCount).toEqual(1);
    expect(doGetTokenSpy.callCount).toEqual(1);

    await credential.getToken(scope);
    expect(getTokenSilentSpy.callCount).toEqual(2);
    expect(doGetTokenSpy.callCount).toEqual(1);
  });

  // These tests should not run live because this credential requires user interaction.
  it.skipIf(isLiveMode())("Authenticates with tenantId on getToken", async function () {
    const credential = new DeviceCodeCredential(
      recorder.configureClientOptions({
        tenantId: env.AZURE_TENANT_ID,
        clientId: env.AZURE_CLIENT_ID,
      }),
    );

    await credential.getToken(scope, { tenantId: env.AZURE_TENANT_ID } as GetTokenOptions);
    expect(getTokenSilentSpy.callCount).toEqual(1);
    expect(doGetTokenSpy.callCount).toEqual(1);
  });
});
