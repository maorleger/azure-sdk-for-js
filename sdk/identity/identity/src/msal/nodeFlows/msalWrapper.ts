// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-shadow */
import { AccessToken, GetTokenOptions } from "@azure/core-auth";
import {
  ClientCredentialRequest,
  ConfidentialClientApplication,
  Configuration,
  IConfidentialClientApplication,
  IPublicClientApplication,
  PublicClientApplication,
  SilentFlowRequest,
  UsernamePasswordRequest,
} from "@azure/msal-node";
import {
  defaultLoggerCallback,
  getAuthority,
  getKnownAuthorities,
  getMSALLogLevel,
  msalToPublic,
} from "../utils";

import { IdentityClient } from "../../client/identityClient";
import { MsalNodeOptions } from "./msalNodeCommon";
import { credentialLogger } from "../../util/logging";
import { getLogLevel } from "@azure/logger";

export interface MsalWrapper {
  getToken<F extends (...args: any[]) => Promise<AccessToken | null>>(
    arrayScopes: string[],
    onForceRefresh: F,
    options?: GetTokenOptions,
  ): Promise<AccessToken>;
  getTokenByClientCredential(
    scopes: string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken | null>;
  getTokenByUsernamePassword(
    scopes: string[],
    options?: GetTokenOptions,
  ): Promise<AccessToken | null>;
}

export interface CreateMsalWrapperConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  authorityHost?: string;
}

type CreateMsalWrapperOptions = Pick<
  MsalNodeOptions,
  "tokenCredentialOptions" | "loggingOptions" | "disableInstanceDiscovery"
>;

const logger = credentialLogger("MsalWrapper");

export function createMsalWrapper(
  config: CreateMsalWrapperConfig,
  createOptions?: CreateMsalWrapperOptions,
): MsalWrapper {
  const { clientId, tenantId, authorityHost, clientSecret } = config;
  logger.info(`createMsalWrapper: clientId: ${clientId}, tenantId: ${tenantId}`);
  logger.info(`createMsalWrapper: config: ${JSON.stringify(config)}`);

  // resolveTenantId is called here but keeping it simple
  if (tenantId === undefined) {
    throw new Error("Missing tenantId");
  }
  // resolve additionallyAllowedTenantIds here

  const authority = getAuthority(tenantId, authorityHost);
  logger.info(`createMsalWrapper: authority resolved to: ${authority}`);
  const identityClient = new IdentityClient({
    ...createOptions?.tokenCredentialOptions,
    ...createOptions?.loggingOptions,
    authorityHost: authority,
  });

  const msalConfig: Configuration = {
    auth: {
      clientId,
      authority,
      clientSecret: clientSecret,
      knownAuthorities: getKnownAuthorities(
        tenantId,
        authority,
        createOptions?.disableInstanceDiscovery,
      ),
      clientCapabilities: [],
    },
    system: {
      networkClient: identityClient,
      loggerOptions: {
        loggerCallback: defaultLoggerCallback(logger),
        logLevel: getMSALLogLevel(getLogLevel()),
        piiLoggingEnabled: createOptions?.loggingOptions?.enableUnsafeSupportLogging,
      },
    },
  };

  // Normally there is async work related to plugins that would happen here
  const getMsal = (function () {
    let msal: IPublicClientApplication | IConfidentialClientApplication;
    return function () {
      if (msal) {
        logger.info(`getMsal: returning existing msal instance`);
        return msal;
      }

      if (
        msalConfig.auth.clientSecret ||
        msalConfig.auth.clientAssertion ||
        msalConfig.auth.clientCertificate
      ) {
        logger.info(`getMsal: creating ConfidentialClientApplication`);
        msal = new ConfidentialClientApplication(msalConfig);
      } else {
        logger.info(`getMsal: creating PublicClientApplication`);
        msal = new PublicClientApplication(msalConfig);
      }

      return msal;
    };
  })();

  return {
    getToken: async (
      scopes: string[],
      onForceRefresh: (...args: any[]) => Promise<AccessToken | null>,
      options?: GetTokenOptions,
    ): Promise<AccessToken> => {
      const msal = getMsal();
      const accountsByTenant = await msal.getTokenCache().getAllAccounts();
      // getActiveAccount handles the case where there are multiple accounts but skipping that here
      if (accountsByTenant.length === 1) {
        try {
          // have an account, need
          const account = msalToPublic(config.clientId, accountsByTenant[0]);
          logger.info(`getToken: found account: ${account}`);

          //  - build a silent request and and try acquireTokenSilent with it
          const request: SilentFlowRequest = {
            account: accountsByTenant[0],
            scopes,
            authority: msalConfig.auth.authority,
            claims: options?.claims,
          };

          logger.info(`getToken: attempting to acquireTokenSilent`);
          logger.info(`getToken: request: ${JSON.stringify(request)}`);

          const response = await msal.acquireTokenSilent(request);
          logger.info(`getToken: response: ${JSON.stringify(response)}`);
          return {
            token: response!.accessToken!,
            expiresOnTimestamp: response!.expiresOn!.getTime(),
          };
        } catch (err: any) {
          if (err.name !== "AuthenticationRequiredError") {
            throw err;
          }
          logger.info(`getToken: acquireTokenSilent failed: ${err}`);
        }
        const token = await onForceRefresh(scopes, options);
        logger.info(`getToken: onForceRefresh returned: ${token}`);
        if (token === null) {
          throw new Error("Failed to retrieve token from onForceRefresh");
        }
        return {
          token: token.token,
          expiresOnTimestamp: token.expiresOnTimestamp,
        };
      } else {
        // no accounts, need to do interactive flow
        logger.info(`getToken: no accounts found, doing interactive flow`);
        const token = await onForceRefresh(scopes, options);
        logger.info(`getToken: onForceRefresh returned: ${JSON.stringify(token)}`);
        if (token === null) {
          throw new Error("Failed to retrieve token from onForceRefresh");
        }
        return {
          token: token.token,
          expiresOnTimestamp: token.expiresOnTimestamp,
        };
      }
    },
    getTokenByClientCredential: async (
      scopes: string[],
      options?: GetTokenOptions,
    ): Promise<AccessToken | null> => {
      logger.info(`getTokenByClientCredential: scopes: ${scopes}, options: ${options}`);

      const request: ClientCredentialRequest = {
        scopes,
        authority: msalConfig.auth.authority,
        claims: options?.claims,
      };

      const msal = getMsal();
      if ("acquireTokenByClientCredential" in msal) {
        const result = await msal.acquireTokenByClientCredential(request);

        logger.info(`acquireTokenByClientCredential: result: ${JSON.stringify(result)}`);

        if (result?.accessToken === undefined || result?.expiresOn === undefined) {
          return null;
        }

        return {
          token: result!.accessToken!,
          expiresOnTimestamp: result!.expiresOn!.getTime(),
        };
      }
      logger.info("returning null because application is public");
      return null;
    },
    getTokenByUsernamePassword: async (
      scopes: string[],
      options?: GetTokenOptions,
    ): Promise<AccessToken | null> => {
      logger.info(
        `getTokenByUsernamePassword: scopes: ${scopes}, options: ${JSON.stringify(options)}`,
      );

      const request: UsernamePasswordRequest = {
        scopes,
        username: process.env.AZURE_USERNAME!,
        password: process.env.AZURE_PASSWORD!,
        authority: msalConfig.auth.authority,
        claims: options?.claims,
      };

      const result = await getMsal().acquireTokenByUsernamePassword(request);

      logger.info(`getTokenByUsernamePassword: result: ${JSON.stringify(result)}`);

      if (result?.accessToken === undefined || result?.expiresOn === undefined) {
        return null;
      }

      return {
        token: result!.accessToken!,
        expiresOnTimestamp: result!.expiresOn!.getTime(),
      };
    },
  };
  // skipping broker, persistencePlugins, etc
}
