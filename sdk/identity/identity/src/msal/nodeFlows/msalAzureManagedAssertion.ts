// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions } from "@azure/core-auth";
import { MsalNode, MsalNodeOptions } from "./msalNodeCommon";

import { handleMsalError } from "../utils";

export interface MsalAzureManagedAssertionOptions extends MsalNodeOptions {
  clientAssertion: () => Promise<string>;
  azureObjectId: string;
}
export class MsalAzureManagedAssertion extends MsalNode {
  azureObjectId: string;
  clientAssertion: () => Promise<string>;
  constructor(options: MsalAzureManagedAssertionOptions) {
    super(options);
    this.requiresConfidential = true;
    this.azureObjectId = options.azureObjectId;
    this.clientAssertion = options.clientAssertion;
  }

  protected async doGetToken(
    scopes: string[],
    options?: GetTokenOptions | undefined,
  ): Promise<AccessToken> {
    try {
      const assertion = await this.clientAssertion();
      const result = await this.getApp(
        "confidential",
        options?.enableCae,
      ).acquireTokenByAzureManagedAssertion({
        scopes,
        azureRegion: this.azureRegion,
        claims: options?.claims,
        clientAssertion: assertion,
        azureObjectId: this.azureObjectId,
      } as any);
      return this.handleResult(scopes, result || undefined);
    } catch (err: any) {
      throw handleMsalError(scopes, err, options);
    }
  }
}
