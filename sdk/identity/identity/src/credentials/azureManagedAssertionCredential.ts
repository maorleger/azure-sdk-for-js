// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";
import { MsalClient, createMsalClient } from "../msal/nodeFlows/msalClient";

import { MsalNode } from "../msal/nodeFlows/msalNodeCommon";
import { MultiTenantTokenCredentialOptions } from "./multiTenantTokenCredentialOptions";
import { credentialLogger } from "../util/logging";

const logger = credentialLogger("ClientAssertionCredential");

export class AzureManagedAssertionCredential implements TokenCredential {
  private clientAssertion: () => Promise<string>;
  private azureObjectId: string;
  private msalClient: MsalClient;

  constructor(
    tenantId: string,
    clientId: string,
    clientAssertion: () => Promise<string>,
    azureObjectId: string,
    options: MultiTenantTokenCredentialOptions = {},
  ) {
    this.clientAssertion = clientAssertion;
    this.azureObjectId = azureObjectId;

    // Following existing pattern
    this.msalClient = createMsalClient(clientId, tenantId, options);
  }

  getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken | null> {
    const arrayScopes = Array.isArray(scopes) ? scopes : [scopes];
    return this.msalClient.getTokenByAzureManagedAssertion(
      arrayScopes,
      this.clientAssertion,
      this.azureObjectId,
      options,
    );
  }
}
