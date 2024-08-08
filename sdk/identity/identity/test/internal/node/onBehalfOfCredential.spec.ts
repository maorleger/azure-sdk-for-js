// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as path from "node:path";
import { IdentityTestContext, prepareMSALResponses } from "../../httpRequests.js";
import { IdentityTestContextInterface, createResponse } from "../../httpRequestsCommon.js";
import { OnBehalfOfCredential } from "../../../src/index.js";
import { isNode } from "@azure/core-util";
import { describe, it, assert, afterEach, beforeEach, vi, expect } from "vitest";
import { createHttpHeaders, HttpClient } from "@azure/core-rest-pipeline";
import { createMockedHttpClient, openIdConfigurationResponse } from "../../msalTestUtils.js";

describe("OnBehalfOfCredential", function () {
  // let testContext: IdentityTestContextInterface;

  beforeEach(function () {
    // testContext = new IdentityTestContext({ replaceLogger: true, logLevel: "verbose" });
  });

  afterEach(async function () {
    if (isNode) {
      delete process.env.AZURE_AUTHORITY_HOST;
    }
    vi.restoreAllMocks();
    // await testContext.restore();
  });

  it("authenticates with a secret", async () => {
    const httpClient = createMockedHttpClient();

    const sendRequestMock = vi.mocked(httpClient.sendRequest);

    sendRequestMock.mockImplementation(async (req) => {
      return {
        request: req,
        status: 200,
        headers: createHttpHeaders(),
        bodyAsText: JSON.stringify({
          access_token: "token",
          expires_on: "06/20/2019 02:57:58 +00:00",
        }),
      };
    });

    const credential = new OnBehalfOfCredential({
      tenantId: "adfs",
      clientId: "client",
      clientSecret: "secret",
      userAssertionToken: "user-assertion",
      authorityHost: "https://fake-authority.com",
      httpClient,
    });

    const token = await credential.getToken("https://test/.default");
    expect(token.token).toBeDefined();
    expect(token.expiresOnTimestamp).toBeDefined();

    const lastCallArg = sendRequestMock.mock.lastCall![0];
    expect(lastCallArg.body).toContain("client_secret=secret");
  });

  it("authenticates with a certificate path", async () => {
    const httpClient = createMockedHttpClient();

    const sendRequestMock = vi.mocked(httpClient.sendRequest);
    sendRequestMock.mockImplementation(async (req) => {
      return {
        request: req,
        status: 200,
        headers: createHttpHeaders(),
        bodyAsText: JSON.stringify({
          access_token: "token",
          expires_on: "06/20/2019 02:57:58 +00:00",
        }),
      };
    });

    const certificatePath = path.join("assets", "fake-cert.pem");
    const credential = new OnBehalfOfCredential({
      tenantId: "adfs",
      clientId: "client",
      certificatePath,
      userAssertionToken: "user-assertion",
      authorityHost: "https://fake-authority.com",
      httpClient,
    });

    const token = await credential.getToken("https://test/.default");
    expect(token.token).toBeDefined();
    expect(token.expiresOnTimestamp).toBeDefined();

    const lastCallArg = sendRequestMock.mock.lastCall![0];
    expect(lastCallArg.body).toContain("client_assertion=eyJ");
  });

  it("authenticates with a certificate assertion", async () => {
    const httpClient = createMockedHttpClient();

    const sendRequestMock = vi.mocked(httpClient.sendRequest);
    sendRequestMock.mockImplementation(async (req) => {
      return {
        request: req,
        status: 200,
        headers: createHttpHeaders(),
        bodyAsText: JSON.stringify({
          access_token: "token",
          expires_on: "06/20/2019 02:57:58 +00:00",
        }),
      };
    });

    const credential = new OnBehalfOfCredential({
      tenantId: "adfs",
      clientId: "client",
      getAssertion: () => Promise.resolve("foo"),
      userAssertionToken: "user-assertion",
      authorityHost: "https://fake-authority.com",
      httpClient,
    });

    const token = await credential.getToken("https://test/.default");
    expect(token.token).toBeDefined();
    expect(token.expiresOnTimestamp).toBeDefined();

    const lastCallArg = sendRequestMock.mock.lastCall![0];
    expect(lastCallArg.body).toContain("client_assertion=foo");
  });
});
