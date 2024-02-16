// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";

import { MsalFlow } from "../msal/flows";

export class AzureManagedClientAssertionCredential implements TokenCredential {
  private tenantId: string;
  private clientId: string;
  private msalFlow: MsalFlow;

  constructor(
    clientId: string,
    tenantId: string,
    myAzureParam1: string,
    myAssertionCallback: () => Promise<string>,
    options: any = {},
  ) {
    if (!tenantId) {
      throw new Error(
        "AzureManagedClientAssertionCredential: tenantId is a required parameter. To troubleshoot, visit https://aka.ms/azsdk/js/identity/serviceprincipalauthentication/troubleshoot.",
      );
    }

    this.tenantId = tenantId;
    this.clientId = clientId;

    this.msalFlow = new MsalAzureManagedClientAssertion({
      clientId: this.clientId,
      tenantId: this.tenantId,
      tokenCredentialOptions: options,
      myAzureParam1,
      myAssertionCallback,
      ...options,
    });
  }

  getToken(
    scopes: string | string[],
    options?: GetTokenOptions | undefined,
  ): Promise<AccessToken | null> {
    if (typeof scopes === "string") {
      scopes = [scopes];
    }
    return this.msalFlow.getToken(scopes, options);
  }
}
