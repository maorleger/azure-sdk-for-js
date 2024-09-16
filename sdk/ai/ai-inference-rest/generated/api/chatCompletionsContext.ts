// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TokenCredential, KeyCredential } from "@azure/core-auth";
import { ClientOptions, Client, getClient } from "@azure-rest/core-client";
import { logger } from "../logger.js";
import { isKeyCredential } from "@azure/core-auth";

export interface ModelContext extends Client {}

/** Optional parameters for the client. */
export interface ChatCompletionsClientOptionalParams extends ClientOptions {
  /** The API version to use for this operation. */
  apiVersion?: string;
}

export function createChatCompletions(
  endpoint: string,
  credential: KeyCredential | KeyCredential | TokenCredential,
  options: ChatCompletionsClientOptionalParams = {},
): ModelContext {
  const prefixFromOptions = options?.userAgentOptions?.userAgentPrefix;
  const userAgentPrefix = prefixFromOptions
    ? `${prefixFromOptions} azsdk-js-api`
    : "azsdk-js-api";
  const { apiVersion: _, ...updatedOptions } = {
    ...options,
    userAgentOptions: { userAgentPrefix },
    loggingOptions: { logger: options.loggingOptions?.logger ?? logger.info },
    credentials: {
      scopes: options.credentials?.scopes ?? ["https://ml.azure.com/.default"],
      apiKeyHeaderName: options.credentials?.apiKeyHeaderName ?? "api-key",
    },
  };
  const clientContext = getClient(
    options.endpoint ?? options.baseUrl ?? endpoint,
    credential,
    updatedOptions,
  );

  if (isKeyCredential(credential)) {
    clientContext.pipeline.addPolicy({
      name: "customKeyCredentialPolicy",
      sendRequest(request, next) {
        request.headers.set("Authorization", "Bearer " + credential.key);
        return next(request);
      },
    });
  }
  clientContext.pipeline.removePolicy({ name: "ApiVersionPolicy" });
  const apiVersion = options.apiVersion ?? "2024-05-01-preview";
  clientContext.pipeline.addPolicy({
    name: "ClientApiVersionPolicy",
    sendRequest: (req, next) => {
      // Use the apiVersion defined in request url directly
      // Append one if there is no apiVersion and we have one at client options
      const url = new URL(req.url);
      if (!url.searchParams.get("api-version")) {
        req.url = `${req.url}${
          Array.from(url.searchParams.keys()).length > 0 ? "&" : "?"
        }api-version=${apiVersion}`;
      }

      return next(req);
    },
  });
  return clientContext;
}
