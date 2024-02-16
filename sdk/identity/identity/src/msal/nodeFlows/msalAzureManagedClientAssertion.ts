// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions } from "@azure/core-auth";

import { CredentialFlowGetTokenOptions } from "../credentials";
import { MsalNode } from "./msalNodeCommon";

export class MsalAzureManagedClientAssertion extends MsalNode {
  myAssertionCallback: any;
  myAzureParam1: any;

  constructor(options: any = {}) {
    super(options);
    this.requiresConfidential = true;
    this.myAssertionCallback = options.myAssertionCallback;
    this.myAzureParam1 = options.myAzureParam1;
  }

  protected async doGetToken(
    scopes: string[],
    options: CredentialFlowGetTokenOptions = {}, // no customization or specificity in options
  ): Promise<AccessToken> {
    const assertion = await this.myAssertionCallback();

    // `this` comes from the MsalNode class or from this class
    const result = await this.getApp(
      "confidential",
      options.enableCae,
    ).acquireTokenByClientCredential({
      scopes,
      correlationId: options.correlationId,
      azureRegion: this.azureRegion,
      authority: options.authority,
      claims: options.claims,
      clientAssertion: assertion,
    });

    // Some weird comment about the Client Credential flow not returning an account which impacts whether silent flow can be used?
    // The Client Credential flow does not return an account,
    // so each time getToken gets called, we will have to acquire a new token through the service.
    return this.handleResult(scopes, result || undefined);
  }
}
