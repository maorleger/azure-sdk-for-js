// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IdentityTestContextInterface, createResponse } from "../../httpRequestsCommon";
import { afterEach, beforeEach, describe, it } from "vitest";

import { AzureApplicationCredential } from "../../../src/credentials/azureApplicationCredential";
import { IdentityTestContext } from "../../httpRequests";
import { RestError } from "@azure/core-rest-pipeline";
import { expect } from "chai";

describe("AzureApplicationCredential testing Managed Identity (internal)", function () {
  let envCopy: string = "";
  let testContext: IdentityTestContextInterface;

  beforeEach(async () => {
    envCopy = JSON.stringify(process.env);
    delete process.env.MSI_ENDPOINT;
    delete process.env.MSI_SECRET;
    delete process.env.AZURE_CLIENT_SECRET;
    delete process.env.AZURE_TENANT_ID;
    testContext = new IdentityTestContext({});
  });
  afterEach(async () => {
    const env = JSON.parse(envCopy);
    process.env.MSI_ENDPOINT = env.MSI_ENDPOINT;
    process.env.MSI_SECRET = env.MSI_SECRET;
    process.env.AZURE_CLIENT_SECRET = env.AZURE_CLIENT_SECRET;
    process.env.AZURE_TENANT_ID = env.AZURE_TENANT_ID;
    await testContext.restore();
  });

  it("returns error when no MSI is available", async function () {
    process.env.AZURE_CLIENT_ID = "errclient";

    const { error } = await testContext.sendCredentialRequests({
      scopes: ["scopes"],
      credential: new AzureApplicationCredential(),
      insecureResponses: [
        {
          error: new RestError("Request Timeout", { code: "REQUEST_SEND_ERROR", statusCode: 408 }),
        },
      ],
    });
    expect(error!.message).to.include("No MSI credential available");
  });

  it("an unexpected error bubbles all the way up", async function () {
    process.env.AZURE_CLIENT_ID = "errclient";

    const errorMessage = "ManagedIdentityCredential authentication failed.";

    const { error } = await testContext.sendCredentialRequests({
      scopes: ["scopes"],
      credential: new AzureApplicationCredential(),
      insecureResponses: [
        createResponse(200), // IMDS Endpoint ping
        { error: new RestError(errorMessage, { statusCode: 500 }) },
      ],
    });
    expect(error?.message).to.include(errorMessage);
  });

  it("returns expected error when the network was unreachable", async function () {
    process.env.AZURE_CLIENT_ID = "errclient";

    const netError: RestError = new RestError("Request Timeout", {
      code: "ENETUNREACH",
      statusCode: 408,
    });

    const { error } = await testContext.sendCredentialRequests({
      scopes: ["scopes"],
      credential: new AzureApplicationCredential(),
      insecureResponses: [
        createResponse(200), // IMDS Endpoint ping
        { error: netError },
      ],
    });
    expect(error!.message!).to.include("Network unreachable.");
  });

  it("sends an authorization request correctly in an App Service environment", async () => {
    // Trigger App Service behavior by setting environment variables
    process.env.AZURE_CLIENT_ID = "client";
    process.env.MSI_ENDPOINT = "https://endpoint";
    process.env.MSI_SECRET = "secret";

    const authDetails = await testContext.sendCredentialRequests({
      scopes: ["https://service/.default"],
      credential: new AzureApplicationCredential(),
      secureResponses: [
        createResponse(200, {
          access_token: "token",
          expires_on: "06/20/2019 02:57:58 +00:00",
        }),
      ],
    });

    const authRequest = authDetails.requests[0];
    const query = new URLSearchParams(authRequest.url.split("?")[1]);

    expect(authRequest.method).to.equal("GET");
    expect(query.get("clientid")).to.equal("client");
    expect(decodeURIComponent(query.get("resource")!)).to.equal("https://service");
    expect(
      authRequest.url.startsWith(process.env.MSI_ENDPOINT),
      "URL does not start with expected host and path",
    );
    expect(authRequest.headers.secret).to.equal(process.env.MSI_SECRET);
    expect(query.get("api-version")).to.equal("2017-09-01");
    expect(authDetails.result?.expiresOnTimestamp).to.equal(1560999478000);
  });
});
