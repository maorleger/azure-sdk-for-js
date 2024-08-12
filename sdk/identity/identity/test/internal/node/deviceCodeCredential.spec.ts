// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup.js";
import { Recorder, env, isLiveMode } from "@azure-tools/test-recorder";
import { DeviceCodeCredential } from "../../../src/index.js";
import {
  AuthenticationResult,
  DeviceCodeRequest,
  PublicClientApplication,
  SilentFlowRequest,
} from "@azure/msal-node";
import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";

describe("DeviceCodeCredential (internal)", function () {
  let cleanup: MsalTestCleanup;
  let getTokenSilentSpy: MockInstance<
    (request: SilentFlowRequest) => Promise<AuthenticationResult>
  >;
  let doGetTokenSpy: MockInstance<
    (request: DeviceCodeRequest) => Promise<AuthenticationResult | null>
  >;
  let recorder: Recorder;

  beforeEach(async function (ctx) {
    const setup = await msalNodeTestSetup(ctx);
    cleanup = setup.cleanup;
    recorder = setup.recorder;

    // MsalClient calls to this method underneath when silent authentication can be attempted.
    getTokenSilentSpy = vi.spyOn(PublicClientApplication.prototype, "acquireTokenSilent");

    // MsalClient calls to this method underneath for interactive auth.
    doGetTokenSpy = vi.spyOn(PublicClientApplication.prototype, "acquireTokenByDeviceCode");
  });
  afterEach(async function () {
    await cleanup();
    vi.restoreAllMocks();
  });

  const scope = "https://vault.azure.net/.default";

  it("Authenticates silently after the initial request", async function (ctx) {
    // These tests should not run live because this credential requires user interaction.
    if (isLiveMode()) {
      ctx.skip();
    }
    const credential = new DeviceCodeCredential(
      recorder.configureClientOptions({
        tenantId: env.AZURE_TENANT_ID,
        clientId: env.AZURE_CLIENT_ID,
      }),
    );

    await credential.getToken(scope);
    expect(doGetTokenSpy).toHaveBeenCalled();

    await credential.getToken(scope);
    expect(getTokenSilentSpy).toHaveBeenCalled();
    expect(doGetTokenSpy).toHaveBeenCalledTimes(1);
  });

  it("Authenticates with tenantId on getToken", async function (ctx) {
    // These tests should not run live because this credential requires user interaction.
    if (isLiveMode()) {
      ctx.skip();
    }
    const credential = new DeviceCodeCredential(
      recorder.configureClientOptions({
        tenantId: env.AZURE_TENANT_ID,
        clientId: env.AZURE_CLIENT_ID,
      }),
    );

    await credential.getToken(scope, { tenantId: env.AZURE_TENANT_ID });
    expect(doGetTokenSpy).toHaveBeenCalled();
  });
});
