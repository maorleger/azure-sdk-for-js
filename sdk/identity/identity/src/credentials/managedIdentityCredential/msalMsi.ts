// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";
import { ManagedIdentityApplication } from "@azure/msal-node";
import { ensureValidMsalToken, getMSALLogLevel } from "../../msal/utils";
import { getLogLevel, setLogLevel } from "@azure/logger";
import { credentialLogger } from "../../util/logging";
import { mapScopesToResource } from "./utils";
import { IdentityClient } from "../../client/identityClient";

setLogLevel("info");
const logger = credentialLogger("ManagedIdentityCredential");

/**
 * TODOs:
 * - [ ] SystemAssigned
 * - [ ] UserAssigned
 * - [ ] ResourceId?
 */

export class MsalManagedIdentityCredential implements TokenCredential {
  managedIdentityApp: ManagedIdentityApplication;
  identityClient: IdentityClient;

  constructor() {
    this.identityClient = new IdentityClient({
      userAgentOptions: {
        userAgentPrefix: "msal-managed-identity",
      },
    });
    this.managedIdentityApp = new ManagedIdentityApplication({
      managedIdentityIdParams: {},
      system: {
        networkClient: this.identityClient,
        loggerOptions: {
          logLevel: getMSALLogLevel(getLogLevel()),
        },
      },
    });
  }
  async getToken(
    scopes: string | string[],
    options?: GetTokenOptions | undefined,
  ): Promise<AccessToken | null> {
    const resource = mapScopesToResource(scopes);
    if (!resource) {
      throw new Error(`${logger.info("Multiple scopes are not supported.")}`);
    }

    const response = await this.managedIdentityApp.acquireToken({
      resource,
    });

    // At this point we should have a token, process it
    ensureValidMsalToken(scopes, response, options);

    logger.getToken.info("Successfully acquired a token.");

    return {
      token: response.accessToken,
      expiresOnTimestamp: response.expiresOn.getTime(),
    };
  }
}
