// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { AuthError, AuthenticationResult, ManagedIdentityApplication } from "@azure/msal-node";
import { AuthenticationRequiredError, CredentialUnavailableError } from "../../../../src/errors.js";
import { MockInstance, afterEach, assert, beforeEach, describe, expect, it, vi } from "vitest";

import { MsalMsiProvider } from "../../../../src/credentials/managedIdentityCredential/msalMsiProvider.js";
import { RestError } from "@azure/core-rest-pipeline";
import { imdsMsi } from "../../../../src/credentials/managedIdentityCredential/imdsMsi.js";
import { tokenExchangeMsi } from "../../../../src/credentials/managedIdentityCredential/tokenExchangeMsi.js";

describe("ManagedIdentityCredential (MSAL)", function () {
  let acquireTokenStub: MockInstance;
  let imdsIsAvailableStub: MockInstance;

  const validAuthenticationResult: Partial<AuthenticationResult> = {
    accessToken: "test_token",
    expiresOn: new Date(),
  };

  beforeEach(function () {
    acquireTokenStub = vi.spyOn(ManagedIdentityApplication.prototype, "acquireToken");
    imdsIsAvailableStub = vi.spyOn(imdsMsi, "isAvailable").mockResolvedValue(true); // Skip pinging the IMDS endpoint in tests
  });

  afterEach(function () {
    vi.restoreAllMocks();
  });

  describe("constructor", function () {
    describe("constructor overloads", function () {
      // ensures that the constructor supports the following signatures:
      // 1. MsalMsiProvider(options: MsalMsiOptions)
      // 2. MsalMsiProvider(clientId: string, options: MsalMsiOptions)
      // by relying on the error handling of the constructor
      it("throws when both clientId and resourceId are provided", function () {
        assert.throws(
          () => new MsalMsiProvider("id", { resourceId: "id" }),
          /provided at the same time./,
        );
      });
      it("throws when both clientId and resourceId are provided via options", function () {
        assert.throws(
          () => new MsalMsiProvider({ clientId: "id", resourceId: "id" }),
          /provided at the same time./,
        );
      });
    });
  });

  describe("#getToken", function () {
    describe("when getToken is successful", function () {
      it("returns a token", async function () {
        acquireTokenStub.mockResolvedValue(validAuthenticationResult as AuthenticationResult);
        const provider = new MsalMsiProvider();
        const token = await provider.getToken("scope");
        assert.strictEqual(token.token, validAuthenticationResult.accessToken);
        assert.strictEqual(
          token.expiresOnTimestamp,
          validAuthenticationResult.expiresOn?.getTime(),
        );
      });

      describe("when using tokenExchangeMsi", function () {
        it("gets a token using the tokenExchangeMsi implementation", async function () {
          const validToken = {
            token: "test_token",
            expiresOnTimestamp: new Date().getTime(),
          };
          vi.spyOn(tokenExchangeMsi, "isAvailable").mockResolvedValue(true);
          vi.spyOn(tokenExchangeMsi, "getToken").mockResolvedValue(validToken);

          const provider = new MsalMsiProvider();
          const token = await provider.getToken("scope");
          assert.strictEqual(token.token, validToken.token);
          assert.strictEqual(token.expiresOnTimestamp, validToken.expiresOnTimestamp);
        });
      });

      describe("when using IMDS", function () {
        it("probes the IMDS endpoint", async function () {
          vi.spyOn(
            ManagedIdentityApplication.prototype,
            "getManagedIdentitySource",
          ).mockReturnValue("DefaultToImds");
          acquireTokenStub.mockResolvedValue(validAuthenticationResult as AuthenticationResult);

          const provider = new MsalMsiProvider();
          await provider.getToken("scope");
          expect(imdsIsAvailableStub).toHaveBeenCalledOnce();
        });
      });
    });

    it("validates multiple scopes are not supported", async function () {
      const provider = new MsalMsiProvider();
      await expect(provider.getToken(["scope1", "scope2"])).rejects.toThrowError(/Multiple scopes/);
    });

    describe("error handling", function () {
      it("rethrows AuthenticationRequiredError", async function () {
        acquireTokenStub.mockRejectedValue(new AuthenticationRequiredError({ scopes: ["scope"] }));
        const provider = new MsalMsiProvider();
        await expect(provider.getToken("scope")).rejects.toThrowError(AuthenticationRequiredError);
      });

      it("handles an unreachable network error", async function () {
        acquireTokenStub.mockRejectedValue(new AuthError("network_error"));
        const provider = new MsalMsiProvider();
        await expect(provider.getToken("scope")).rejects.toThrowError(CredentialUnavailableError);
      });

      it("handles a 403 status code", async function () {
        acquireTokenStub.mockRejectedValue(
          new RestError("A socket operation was attempted to an unreachable network", {
            statusCode: 403,
          }),
        );
        const provider = new MsalMsiProvider();
        await expect(provider.getToken("scope")).rejects.toThrowError(/Network unreachable/);
      });

      it("handles unexpected errors", async function () {
        acquireTokenStub.mockRejectedValue(new Error("Some unexpected error"));
        const provider = new MsalMsiProvider();
        await expect(provider.getToken("scope")).rejects.toThrowError(/Authentication failed/);
      });
    });
  });
});
