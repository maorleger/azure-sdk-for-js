// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";

import { MsalNode } from "../msal/nodeFlows/msalNodeCommon";
import { MultiTenantTokenCredentialOptions } from "./multiTenantTokenCredentialOptions";
import { credentialLogger } from "../util/logging";

const logger = credentialLogger("ClientAssertionCredential");

export class AzureManagedAssertionCredential implements TokenCredential {
  private clientAssertion: () => Promise<string>;
  private azureObjectId: string;
  private msalFlow: MsalNode;

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
    this.msalFlow = new MsalAzureManagedAssertion({
      ...options,
      logger,
      clientId,
      tenantId,
      tokenCredentialOptions: options,
      clientAssertion,
      azureObjectId,
    });
  }

  getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken | null> {
    const arrayScopes = Array.isArray(scopes) ? scopes : [scopes];
    return this.msalFlow.getToken(arrayScopes, options);
  }
}
