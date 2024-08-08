// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { AzureLogger, setLogLevel } from "@azure/logger";
import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup.js";
import { Recorder, isPlaybackMode } from "@azure-tools/test-recorder";
import {
  AuthenticationResult,
  PublicClientApplication,
  SilentFlowRequest,
  UsernamePasswordRequest,
} from "@azure/msal-node";
import { UsernamePasswordCredential } from "../../../src/index.js";
import { getUsernamePasswordStaticResources } from "../../msalTestUtils.js";
import { describe, it, assert, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";

describe("UsernamePasswordCredential (internal)", function () {
  let cleanup: MsalTestCleanup;
  let getTokenSilentSpy: MockInstance<
    (request: SilentFlowRequest) => Promise<AuthenticationResult>
  >;
  let doGetTokenSpy: MockInstance<
    (request: UsernamePasswordRequest) => Promise<AuthenticationResult | null>
  >;
  let recorder: Recorder;

  beforeEach(async function (ctx) {
    const setup = await msalNodeTestSetup(ctx);
    cleanup = setup.cleanup;
    recorder = setup.recorder;

    // MsalClient calls to this method underneath when silent authentication can be attempted.
    getTokenSilentSpy = vi.spyOn(PublicClientApplication.prototype, "acquireTokenSilent");

    // MsalClient calls to this method underneath for interactive auth.
    doGetTokenSpy = vi.spyOn(PublicClientApplication.prototype, "acquireTokenByUsernamePassword");
  });

  afterEach(async function () {
    await cleanup();
    vi.restoreAllMocks();
  });

  const scope = "https://vault.azure.net/.default";

  it("Should throw if the parameteres are not correctly specified", async function () {
    const errors: Error[] = [];
    try {
      new UsernamePasswordCredential(
        undefined as any,
        "azure_client_id",
        "azure_username",
        "azure_password",
      );
    } catch (e: any) {
      errors.push(e);
    }
    try {
      new UsernamePasswordCredential(
        "azure_tenant_id",
        undefined as any,
        "azure_username",
        "azure_password",
      );
    } catch (e: any) {
      errors.push(e);
    }
    try {
      new UsernamePasswordCredential(
        "azure_tenant_id",
        "azure_client_id",
        undefined as any,
        "azure_password",
      );
    } catch (e: any) {
      errors.push(e);
    }
    try {
      new UsernamePasswordCredential(
        "azure_tenant_id",
        "azure_client_id",
        "azure_username",
        undefined as any,
      );
    } catch (e: any) {
      errors.push(e);
    }

    try {
      new UsernamePasswordCredential(
        undefined as any,
        undefined as any,
        undefined as any,
        undefined as any,
      );
    } catch (e: any) {
      errors.push(e);
    }
    assert.equal(errors.length, 5);
    errors.forEach((e) => {
      assert.equal(
        e.message,
        "UsernamePasswordCredential: tenantId, clientId, username and password are required parameters. To troubleshoot, visit https://aka.ms/azsdk/js/identity/usernamepasswordcredential/troubleshoot.",
      );
    });
  });

  it("Authenticates silently after the initial request", async function (ctx) {
    const { clientId, password, tenantId, username } = getUsernamePasswordStaticResources();
    const credential = new UsernamePasswordCredential(
      tenantId,
      clientId,
      username,
      password,
      recorder.configureClientOptions({}),
    );

    await credential.getToken(scope);
    expect(getTokenSilentSpy).not.toHaveBeenCalled();
    expect(doGetTokenSpy).toHaveBeenCalledOnce();

    await credential.getToken(scope);

    expect(getTokenSilentSpy).toHaveBeenCalledOnce();
    expect(doGetTokenSpy).toHaveBeenCalledOnce();
  });

  it("Authenticates with tenantId on getToken", async function (ctx) {
    const { clientId, password, tenantId, username } = getUsernamePasswordStaticResources();
    const credential = new UsernamePasswordCredential(
      tenantId,
      clientId,
      username,
      password,
      recorder.configureClientOptions({}),
    );

    await credential.getToken(scope);
    expect(doGetTokenSpy).toHaveBeenCalledOnce();
  });

  it.skipIf(isPlaybackMode())(
    "authenticates (with allowLoggingAccountIdentifiers set to true)",
    async function (ctx) {
      const { clientId, password, tenantId, username } = getUsernamePasswordStaticResources();
      const credential = new UsernamePasswordCredential(tenantId, clientId, username, password, {
        loggingOptions: { allowLoggingAccountIdentifiers: true },
      });
      setLogLevel("info");
      const spy = vi.spyOn(process.stderr, "write");

      const token = await credential.getToken(scope);
      assert.ok(token?.token);
      assert.ok(token?.expiresOnTimestamp! > Date.now());
      assert.ok(spy.mock.calls[spy.mock.calls.length - 2][0]);
      // const expectedMessage = `azure:identity:info [Authenticated account] Client ID: ${clientId}. Tenant ID: ${tenantId}. User Principal Name: HIDDEN. Object ID (user): HIDDEN`;
      // assert.equal(
      //   (spy.getCall(spy.callCount - 2).args[0] as any as string)
      //     .replace(/User Principal Name: [^ ]+. /g, "User Principal Name: HIDDEN. ")
      //     .replace(
      //       /Object ID .user.: [a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/g,
      //       "Object ID (user): HIDDEN",
      //     )
      //     .trim(),
      //   expectedMessage,
      // );
      AzureLogger.destroy();
    },
  );
});
