// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions } from "@azure/core-auth";
import {
  ConfidentialClientApplication,
  Configuration,
  IConfidentialClientApplication,
  SilentFlowRequest,
} from "@azure/msal-node";
import { getAuthority, getKnownAuthorities, msalToPublic, publicToMsal } from "../utils";

import { AuthenticationRecord } from "../types";
import { AuthenticationRequiredError } from "../../errors";

export interface MsalWrapper {
  getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    arrayScopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken>;
  getTokenByClientCredential(
    scopes: string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken | null>;
}

export function createMsalWrapper(createMsalWrapperOptions: any = {}): MsalWrapper {
  // State...
  console.log("options", createMsalWrapperOptions);

  const { tenantId }: { tenantId: string; clientId: string } =
    createMsalWrapperOptions.msalConfig.auth;
  // TODO: plumb configuration via params to this wrapper
  // TODO: handle multiple app kinds
  // // Ask and understand why and when we have multiple apps, _and_ whether a single instance can have multiple apps as a valid usecase
  const msalConfig: Configuration = createMsalWrapperOptions.msalConfig;
  msalConfig.auth.authority = getAuthority(tenantId);
  msalConfig.auth.knownAuthorities = getKnownAuthorities(tenantId, msalConfig.auth.authority);
  msalConfig.auth.clientCapabilities = [];

  const app = new ConfidentialClientApplication(createMsalWrapperOptions.msalConfig);
  function getApp(..._args: any[]): IConfidentialClientApplication {
    return app;
  }

  async function getActiveAccount(
    scopes: string[],
    enableCae: boolean,
  ): Promise<AuthenticationRecord> {
    const cache = getApp({ kind: "confidential", enableCae }).getTokenCache();
    const accountsByTenant = await cache?.getAllAccounts();
    if (accountsByTenant.length === 1) {
      return msalToPublic(createMsalWrapperOptions.msalConfig.auth.clientId, accountsByTenant[0]);
    }
    throw new AuthenticationRequiredError({
      message:
        "Silent authentication failed. We couldn't retrieve an active account from the cache.",
      scopes,
    });
  }

  async function getTokenByClientCredential(
    scopes: string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken | null> {
    const result = await app.acquireTokenByClientCredential({
      scopes,
      claims: options?.claims,
    });
    return {
      token: result!.accessToken!,
      expiresOnTimestamp: result!.expiresOn!.getTime(),
    };
  }

  async function getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    scopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken> {
    try {
      console.log("Attempting to acquire token silently");
      const authority = getAuthority(createMsalWrapperOptions.msalConfig.auth.tenantId);
      console.log(authority);
      const account = await getActiveAccount(scopes, false);
      const silentRequest: SilentFlowRequest = {
        account: publicToMsal(account),
        scopes,
        authority,
        claims: options?.claims,
      };
      const response = await app.acquireTokenSilent(silentRequest);
      return {
        token: response!.accessToken,
        expiresOnTimestamp: response.expiresOn!.getTime(),
      };
    } catch (err: any) {
      if (err.name !== "AuthenticationRequiredError") {
        throw err;
      }
      console.log("Falling back to real authentication");
      const refreshResult = await onForceRefresh(scopes, options);
      if (refreshResult?.token === undefined) {
        throw new Error("Failed to authenticate");
      }
      return refreshResult;
    }
  }

  return {
    getToken,
    getTokenByClientCredential,
  };
}

// export class ClientSecretCredential implements TokenCredential {
//   #msalWrapper = createMsalWrapper();
//   constructor(
//     // TODO: push these up once I get the params right
//     private tenantId: string,
//     private clientId: string,
//     private clientSecret: string,
//     private options: ClientSecretCredentialOptions = {},
//   ) {}

//   getToken(
//     scopes: string | string[],
//     options?: GetTokenOptions | undefined,
//   ): Promise<AccessToken | null> {
//     const arrayScopes = Array.isArray(scopes) ? scopes : [scopes];
//     return this.#msalWrapper.getToken(
//       arrayScopes,
//       (scopes, options) => {
//         return this.#msalWrapper.getTokenByClientCredential(scopes, options);
//       },
//       options,
//     );
//   }
// }
