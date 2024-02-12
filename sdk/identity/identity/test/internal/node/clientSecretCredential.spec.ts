// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { AzureLogger, setLogLevel } from "@azure/logger";
import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup";
import { Recorder, env, isLiveMode, isPlaybackMode } from "@azure-tools/test-recorder";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ClientSecretCredential } from "../../../src";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { GetTokenOptions } from "@azure/core-auth";
import { MsalNode } from "../../../src/msal/nodeFlows/msalNodeCommon";
import Sinon from "sinon";

describe("ClientSecretCredential (internal)", function () {
  let cleanup: MsalTestCleanup;
  let getTokenSilentSpy: Sinon.SinonSpy;
  let doGetTokenSpy: Sinon.SinonSpy;
  let recorder: Recorder;
  let sandbox: Sinon.SinonSandbox;

  beforeEach(async function (ctx) {
    const setup = await msalNodeTestSetup(ctx);
    cleanup = setup.cleanup;
    recorder = setup.recorder;
    sandbox = setup.sandbox;

    getTokenSilentSpy = sandbox.spy(MsalNode.prototype, "getTokenSilent");

    // MsalClientSecret calls to this method underneath.
    doGetTokenSpy = sandbox.spy(
      ConfidentialClientApplication.prototype,
      "acquireTokenByClientCredential",
    );
  });

  afterEach(async function () {
    await cleanup();
  });

  const scope = "https://vault.azure.net/.default";

  it("Should throw if the parameteres are not correctly specified", async function () {
    const errors: Error[] = [];
    try {
      new ClientSecretCredential(undefined as any, env.AZURE_CLIENT_ID!, env.AZURE_CLIENT_SECRET!);
    } catch (e: any) {
      errors.push(e);
    }
    try {
      new ClientSecretCredential(env.AZURE_TENANT_ID!, undefined as any, env.AZURE_CLIENT_SECRET!);
    } catch (e: any) {
      errors.push(e);
    }
    try {
      new ClientSecretCredential(env.AZURE_TENANT_ID!, env.AZURE_CLIENT_ID!, undefined as any);
    } catch (e: any) {
      errors.push(e);
    }
    try {
      new ClientSecretCredential(undefined as any, undefined as any, undefined as any);
    } catch (e: any) {
      errors.push(e);
    }

    expect(errors).toHaveLength(4);

    errors.forEach((e) => {
      expect(e.message).toEqual(
        "ClientSecretCredential: tenantId, clientId, and clientSecret are required parameters. To troubleshoot, visit https://aka.ms/azsdk/js/identity/serviceprincipalauthentication/troubleshoot.",
      );
    });
  });

  it.skipIf(isLiveMode())("Authenticates with tenantId on getToken", async function () {
    const credential = new ClientSecretCredential(
      env.AZURE_TENANT_ID!,
      env.AZURE_CLIENT_ID!,
      env.AZURE_CLIENT_SECRET!,
      recorder.configureClientOptions({}),
    );

    await credential.getToken(scope, { tenantId: env.AZURE_TENANT_ID } as GetTokenOptions);
    expect(getTokenSilentSpy.callCount).toEqual(1);
    expect(doGetTokenSpy.callCount).toEqual(1);
  });

  it.skipIf(isLiveMode() || isPlaybackMode())(
    "authenticates (with allowLoggingAccountIdentifiers set to true)",
    async function () {
      const credential = new ClientSecretCredential(
        env.AZURE_TENANT_ID!,
        env.AZURE_CLIENT_ID!,
        env.AZURE_CLIENT_SECRET!,
        recorder.configureClientOptions({
          loggingOptions: { allowLoggingAccountIdentifiers: true },
        }),
      );
      setLogLevel("info");
      const spy = sandbox.spy(process.stderr, "write");

      const token = await credential.getToken(scope);
      expect(token?.token).toBeDefined();
      expect(token?.expiresOnTimestamp!).toBeGreaterThan(Date.now());

      const expectedCall = spy
        .getCalls()
        .find((x) => (x.args[0] as any as string).match(/Authenticated account/));
      expect(expectedCall).toBeDefined();

      const expectedMessage = `azure:identity:info [Authenticated account] Client ID: ${env.AZURE_CLIENT_ID}. Tenant ID: ${env.AZURE_TENANT_ID}. User Principal Name: No User Principal Name available. Object ID (user): HIDDEN`;
      expect(
        (expectedCall!.args[0] as any as string)
          .replace(
            /Object ID .user.: [a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/g,
            "Object ID (user): HIDDEN",
          )
          .trim(),
      ).toEqual(expectedMessage);
      spy.restore();
      AzureLogger.destroy();
    },
  );
});
