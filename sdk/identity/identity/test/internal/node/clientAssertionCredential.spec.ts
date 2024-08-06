// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import * as path from "node:path";

import { MsalTestCleanup, msalNodeTestSetup } from "../../node/msalNodeTestSetup.js";

import { ClientAssertionCredential } from "../../../src/index.js";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { createJWTTokenFromCertificate } from "../../public/node/utils/utils.js";
import { env } from "@azure-tools/test-recorder";
import { describe, it, assert, expect, vi, beforeEach, afterEach } from "vitest";

describe("ClientAssertionCredential (internal)", function () {
  let cleanup: MsalTestCleanup;
  let doGetTokenSpy: Sinon.SinonSpy;

  beforeEach(async function (ctx) {
    const setup = await msalNodeTestSetup(ctx);
    cleanup = setup.cleanup;

    doGetTokenSpy = setup.sandbox.spy(
      ConfidentialClientApplication.prototype,
      "acquireTokenByClientCredential",
    );
  });

  afterEach(async function () {
    await cleanup();
  });

  it("Should throw if the parameteres are not correctly specified", async function () {
    const expectedMessage =
      "ClientAssertionCredential: tenantId, clientId, and clientAssertion are required parameters.";
    assert.throws(
      () =>
        new ClientAssertionCredential(
          undefined as any,
          env.AZURE_CLIENT_ID ?? "client",
          async () => "assertion",
        ),
      expectedMessage,
    );
    assert.throws(
      () =>
        new ClientAssertionCredential(
          env.AZURE_TENANT_ID ?? "tenant",
          undefined as any,
          async () => "assertion",
        ),
      expectedMessage,
    );

    assert.throws(
      () => new ClientAssertionCredential(undefined as any, undefined as any, undefined as any),
      expectedMessage,
    );
  });

  it("Sends the expected parameters", async function () {
    const tenantId = env.IDENTITY_SP_TENANT_ID || env.AZURE_TENANT_ID!;
    const clientId = env.IDENTITY_SP_CLIENT_ID || env.AZURE_CLIENT_ID!;
    const certificatePath = env.IDENTITY_SP_CERT_PEM || path.join("assets", "fake-cert.pem");
    const authorityHost = `https://login.microsoftonline.com/${tenantId}`;
    const jwt = await createJWTTokenFromCertificate(authorityHost, clientId, certificatePath);

    async function getAssertion(): Promise<string> {
      return jwt;
    }
    const credential = new ClientAssertionCredential(tenantId, clientId, getAssertion);

    try {
      await credential.getToken("https://vault.azure.net/.default");
    } catch (e: any) {
      // We're ignoring errors since our main goal here is to ensure that we send the correct parameters to MSAL.
    }

    assert.equal(doGetTokenSpy.callCount, 1);
    assert.equal(doGetTokenSpy.lastCall.firstArg.clientAssertion, getAssertion);
  });
});
