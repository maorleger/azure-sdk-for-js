// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, GetTokenOptions, TokenCredential } from "@azure/core-auth";

import { IdentityClient } from "../../client/identityClient";
import { TokenCredentialOptions } from "../../tokenCredentialOptions";
import { AuthenticationRequiredError } from "../../errors";
import { credentialLogger, formatSuccess } from "../../util/logging";
import { tracingClient } from "../../util/tracing";
import { LogLevel, ManagedIdentityApplication } from "@azure/msal-node";
import { DeveloperSignOnClientId } from "../../constants";
import { MsalResult, MsalToken, ValidMsalToken } from "../../msal/types";

const logger = credentialLogger("ManagedIdentityCredential");

/**
 * Options to send on the {@link ManagedIdentityCredential} constructor.
 * This variation supports `clientId` and not `resourceId`, since only one of both is supported.
 */
export interface ManagedIdentityCredentialClientIdOptions extends TokenCredentialOptions {
  /**
   * The client ID of the user - assigned identity, or app registration(when working with AKS pod - identity).
   */
  clientId?: string;
}

/**
 * Options to send on the {@link ManagedIdentityCredential} constructor.
 * This variation supports `resourceId` and not `clientId`, since only one of both is supported.
 */
export interface ManagedIdentityCredentialResourceIdOptions extends TokenCredentialOptions {
  /**
   * Allows specifying a custom resource Id.
   * In scenarios such as when user assigned identities are created using an ARM template,
   * where the resource Id of the identity is known but the client Id can't be known ahead of time,
   * this parameter allows programs to use these user assigned identities
   * without having to first determine the client Id of the created identity.
   */
  resourceId: string;
}
export class ManagedIdentityCredential implements TokenCredential {
  private identityClient: IdentityClient;
  private clientId: string | undefined;
  private resourceId: string | undefined;
  managedIdentityApp: ManagedIdentityApplication;

  /**
   * Creates an instance of ManagedIdentityCredential with the client ID of a
   * user-assigned identity, or app registration (when working with AKS pod-identity).
   *
   * @param clientId - The client ID of the user-assigned identity, or app registration (when working with AKS pod-identity).
   * @param options - Options for configuring the client which makes the access token request.
   */
  constructor(clientId: string, options?: TokenCredentialOptions);
  /**
   * Creates an instance of ManagedIdentityCredential with clientId
   *
   * @param options - Options for configuring the client which makes the access token request.
   */
  constructor(options?: ManagedIdentityCredentialClientIdOptions);
  /**
   * Creates an instance of ManagedIdentityCredential with Resource Id
   *
   * @param options - Options for configuring the resource which makes the access token request.
   */
  constructor(options?: ManagedIdentityCredentialResourceIdOptions);
  /**
   * @internal
   * @hidden
   */
  constructor(
    clientIdOrOptions?:
      | string
      | ManagedIdentityCredentialClientIdOptions
      | ManagedIdentityCredentialResourceIdOptions,
    options?: TokenCredentialOptions,
  ) {
    let _options: TokenCredentialOptions | undefined;
    if (typeof clientIdOrOptions === "string") {
      this.clientId = clientIdOrOptions;
      _options = options;
    } else {
      this.clientId = (clientIdOrOptions as ManagedIdentityCredentialClientIdOptions)?.clientId;
      _options = clientIdOrOptions;
    }
    this.resourceId = (_options as ManagedIdentityCredentialResourceIdOptions)?.resourceId;
    // For JavaScript users.
    if (this.clientId && this.resourceId) {
      throw new Error(
        `${ManagedIdentityCredential.name} - Client Id and Resource Id can't be provided at the same time.`,
      );
    }
    this.identityClient = new IdentityClient(_options);
    // this.isAvailableIdentityClient = new IdentityClient({
    //   ..._options,
    //   retryOptions: {
    //     maxRetries: 0,
    //   },
    // });

    /**  authority host validation and metadata discovery to be skipped in managed identity
     * since this wasn't done previously before adding token cache support
     */

    this.managedIdentityApp = new ManagedIdentityApplication({
      system: {
        networkClient: this.identityClient,
        loggerOptions: {
          logLevel: LogLevel.Trace,
        },
      },
      managedIdentityIdParams: {
        userAssignedClientId: this.clientId ?? DeveloperSignOnClientId,
        userAssignedResourceId: this.resourceId,
      },
    });
  }

  /**
   * Authenticates with Microsoft Entra ID and returns an access token if successful.
   * If authentication fails, a {@link CredentialUnavailableError} will be thrown with the details of the failure.
   * If an unexpected error occurs, an {@link AuthenticationError} will be thrown with the details of the failure.
   *
   * @param scopes - The list of scopes for which the token will have access.
   * @param options - The options used to configure any requests this
   *                TokenCredential implementation might make.
   */
  public async getToken(
    scopes: string | string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken> {
    const { span, updatedOptions } = tracingClient.startSpan(
      `${ManagedIdentityCredential.name}.getToken`,
      options,
    );
    try {
      const result = await this.managedIdentityApp.acquireToken({
        resource: Array.isArray(scopes) ? scopes[0] : scopes, // needs access to multiple scopes?
      });
      return this.handleResult(scopes, result, updatedOptions);
    } finally {
      // Finally is always called, both if we return and if we throw in the above try/catch.
      span.end();
    }
  }

  /**
   * Handles the MSAL authentication result.
   * If the result has an account, we update the local account reference.
   * If the token received is invalid, an error will be thrown depending on what's missing.
   */
  private handleResult(
    scopes: string | string[],
    result?: MsalResult,
    getTokenOptions?: GetTokenOptions,
  ): AccessToken {
    this.ensureValidMsalToken(scopes, result, getTokenOptions);
    logger.getToken.info(formatSuccess(scopes));
    return {
      token: result.accessToken,
      expiresOnTimestamp: result.expiresOn.getTime(),
    };
  }

  /**
   * Ensures the validity of the MSAL token
   */
  private ensureValidMsalToken(
    scopes: string | string[],
    msalToken?: MsalToken,
    getTokenOptions?: GetTokenOptions,
  ): asserts msalToken is ValidMsalToken {
    const error = (message: string): Error => {
      logger.getToken.info(message);
      return new AuthenticationRequiredError({
        scopes: Array.isArray(scopes) ? scopes : [scopes],
        getTokenOptions,
        message,
      });
    };
    if (!msalToken) {
      throw error("No response");
    }
    if (!msalToken.expiresOn) {
      throw error(`Response had no "expiresOn" property.`);
    }
    if (!msalToken.accessToken) {
      throw error(`Response had no "accessToken" property.`);
    }
  }
}
