// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";

import { AuthenticationRecord } from "../types";
import { ClientSecretCredentialOptions } from "../../credentials/clientSecretCredentialOptions";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { msalToPublic } from "../utils";

export interface MsalWrapper {
  getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    arrayScopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken | null>;
  getTokenByDeviceCode(scopes: string[], options?: GetTokenOptions): Promise<AccessToken | null>;
}

export function createMsalWrapper(options: any = {}): MsalWrapper {
  // State...
  const clientId = options.clientId;
  // let account: AuthenticationRecord | undefined;

  // TODO: plumb configuration via params to this wrapper
  // TODO: handle multiple app kinds
  // // Ask and understand why and when we have multiple apps, _and_ whether a single instance can have multiple apps as a valid usecase
  const app = new ConfidentialClientApplication({ auth: { clientId: "foo" } });
  function getApp({ kind, enableCae }) {
    return app;
  }

  async function getActiveAccount(enableCae: boolean) {
    const cache = getApp({ kind: "confidential", enableCae }).getTokenCache();
    const accountsByTenant = await cache?.getAllAccounts();
    return msalToPublic(clientId, accountsByTenant[0]);
  }

  async function getTokenByDeviceCode(
    scopes: string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken | null> {
    const result = getApp({ kind: "confidential", enableCae: options?.enableCae });
    const account = await getActiveAccount(false);
  }

  function getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    scopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken | null> {
    // get active account
    // create a silent request
    // do the broker thing
    // try to get the token
    // if fails call onForceRefresh
  }

  return {
    getToken,
    getTokenByDeviceCode, // Added missing property
  };
}

export class ClientSecretCredential implements TokenCredential {
  #msalWrapper = createMsalWrapper();
  constructor(
    // TODO: push these up once I get the params right
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
    private options: ClientSecretCredentialOptions = {},
  ) {}

  getToken(
    scopes: string | string[],
    options?: GetTokenOptions | undefined,
  ): Promise<AccessToken | null> {
    const arrayScopes = Array.isArray(scopes) ? scopes : [scopes];
    return this.#msalWrapper.getToken(
      arrayScopes,
      () => {
        return this.#msalWrapper.getTokenByDeviceCode(arrayScopes, options);
      },
      options,
    );
  }
}
