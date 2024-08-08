// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// import * as dac from "../../../src/credentials/defaultAzureCredential.js";

// import { HttpClient, RestError, SendRequest, createHttpHeaders } from "@azure/core-rest-pipeline";
// import { IdentityTestContextInterface, createResponse } from "../../httpRequestsCommon.js";
// import { afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";

// import { AzureApplicationCredential } from "../../../src/credentials/azureApplicationCredential.js";
// import { LegacyMsiProvider } from "../../../src/credentials/managedIdentityCredential/legacyMsiProvider.js";

// describe("AzureApplicationCredential testing Managed Identity (internal)", function () {
//   let testContext: IdentityTestContextInterface;

//   beforeEach(async () => {
//     vi.spyOn(dac, "createDefaultManagedIdentityCredential").mockImplementation(
//       (...args) => { console.log(args); return new LegacyMsiProvider({ ...args, clientId: process.env.AZURE_CLIENT_ID }),
//     );
//   });

//   afterEach(async () => {
//     vi.unstubAllEnvs();
//   });

//   it("returns error when no MSI is available", async function () {
//     vi.stubEnv("AZURE_CLIENT_ID", "errclient");

//     const credential = new AzureApplicationCredential({
//       httpClient: {
//         sendRequest: async () => {
//           throw new RestError("Request Timeout", { code: "REQUEST_SEND_ERROR", statusCode: 408 });
//         },
//       },
//     });

//     await expect(credential.getToken("https://service/.default")).rejects.toThrow(
//       "No MSI credential available",
//     );
//   });

//   it.only("an unexpected error bubbles all the way up", async function () {
//     vi.stubEnv("AZURE_CLIENT_ID", "errclient");

//     const errorMessage = "ManagedIdentityCredential authentication failed.";
//     const httpClient: HttpClient = {
//       sendRequest: async (req) => {
//         return {
//           request: req,
//           status: 200,
//           bodyAsText: "",
//           headers: createHttpHeaders(),
//         };
//       },
//     };

//     // vi.mocked(httpClient.sendRequest)
//     //   .mockImplementation(async (req) => {
//     //     console.log("in mock implementation once");
//     //     return {
//     //       headers: createHttpHeaders(),
//     //       request: req,
//     //       status: 200,
//     //     };
//     //   })
//     //   .mockImplementationOnce(async (req) => {
//     //     console.log("in mock implementation twice");
//     //     throw new RestError(errorMessage, { code: "REQUEST_SEND_ERROR", statusCode: 408 });
//     //   });

//     const credential = new AzureApplicationCredential({
//       httpClient,
//     });

//     await credential.getToken("https://service/.default");

//     // await expect(credential.getToken("https://service/.default")).rejects.toThrow(
//     //   new RegExp(errorMessage),
//     // );
//   });

//   it("returns expected error when the network was unreachable", async function () {
//     process.env.AZURE_CLIENT_ID = "errclient";

//     const netError: RestError = new RestError("Request Timeout", {
//       code: "ENETUNREACH",
//       statusCode: 408,
//     });

//     const { error } = await testContext.sendCredentialRequests({
//       scopes: ["scopes"],
//       credential: new AzureApplicationCredential(),
//       insecureResponses: [
//         createResponse(200), // IMDS Endpoint ping
//         { error: netError },
//       ],
//     });
//     assert.ok(error!.message!.indexOf("Network unreachable.") > -1);
//   });

//   it("sends an authorization request correctly in an App Service environment", async () => {
//     // Trigger App Service behavior by setting environment variables
//     process.env.AZURE_CLIENT_ID = "client";
//     process.env.MSI_ENDPOINT = "https://endpoint";
//     process.env.MSI_SECRET = "secret";

//     const authDetails = await testContext.sendCredentialRequests({
//       scopes: ["https://service/.default"],
//       credential: new AzureApplicationCredential(),
//       secureResponses: [
//         createResponse(200, {
//           access_token: "token",
//           expires_on: "06/20/2019 02:57:58 +00:00",
//         }),
//       ],
//     });

//     const authRequest = authDetails.requests[0];
//     const query = new URLSearchParams(authRequest.url.split("?")[1]);

//     assert.equal(authRequest.method, "GET");
//     assert.equal(query.get("clientid"), "client");
//     assert.equal(decodeURIComponent(query.get("resource")!), "https://service");
//     assert.ok(
//       authRequest.url.startsWith(process.env.MSI_ENDPOINT),
//       "URL does not start with expected host and path",
//     );
//     assert.equal(authRequest.headers.secret, process.env.MSI_SECRET);
//     assert.ok(
//       authRequest.url.indexOf(`api-version=2017-09-01`) > -1,
//       "URL does not have expected version",
//     );
//     if (authDetails.result?.token) {
//       assert.equal(authDetails.result.expiresOnTimestamp, 1560999478000);
//     } else {
//       assert.fail("No token was returned!");
//     }
//   });
// });
