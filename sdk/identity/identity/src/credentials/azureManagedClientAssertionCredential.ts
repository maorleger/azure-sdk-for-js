// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";
import { MsalClient, createMsalClient } from "../msal/nodeFlows/msalClient";

import { MsalFlow } from "../msal/flows";

export class AzureManagedClientAssertionCredential implements TokenCredential {
  private msalClient: MsalClient;
  myAzureParam1: string;
  myAssertionCallback: () => Promise<string>;

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

    this.myAzureParam1 = myAzureParam1;
    this.myAssertionCallback = myAssertionCallback;

    this.msalClient = createMsalClient(clientId, tenantId, options);
  }

  async getToken(
    scopes: string | string[],
    options?: GetTokenOptions | undefined,
  ): Promise<AccessToken | null> {
    if (typeof scopes === "string") {
      scopes = [scopes];
    }
    // resolve the callback here
    const assertion = await this.myAssertionCallback();
    return this.msalClient.getTokenByAzureManagedClientAssertion(
      scopes,
      // required params are required
      this.myAzureParam1,
      assertion,
      options,
    );
  }
}
