// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";

import { ClientSecretCredentialOptions } from "../../credentials/clientSecretCredentialOptions";

export interface MsalWrapper {
  getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    arrayScopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken | null>;
  getTokenByDeviceCode(scopes: string[], options?: GetTokenOptions): Promise<AccessToken | null>;
}

export function createMsalWrapper(): MsalWrapper {
  function getTokenByDeviceCode(
    scopes: string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken | null> {}

  function getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    scopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken | null> {}

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
