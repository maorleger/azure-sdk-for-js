// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// @ts-ignore the types are incorrect in this package
import { ICachePlugin, INativeBrokerPlugin } from "@azure/msal-node";

import { TokenCachePersistenceOptions } from "../msal/nodeFlows/tokenCachePersistenceOptions.js";
import { VSCodeCredentialFinder } from "../credentials/visualStudioCodeCredentialPlugin.js";

/**
 * The type of an Azure Identity plugin, a function accepting a plugin
 * context.
 */
export type IdentityPlugin = (context: unknown) => void;

/**
 * Plugin context entries for controlling cache plugins.
 */
export interface CachePluginControl {
  setPersistence(
    persistenceFactory: (options?: TokenCachePersistenceOptions) => Promise<ICachePlugin>,
  ): void;
}

export interface NativeBrokerPluginControl {
  setNativeBroker(nativeBroker: INativeBrokerPlugin): void;
}

/**
 * Plugin context entries for controlling VisualStudioCodeCredential.
 */
export interface VisualStudioCodeCredentialControl {
  setVsCodeCredentialFinder(finder: VSCodeCredentialFinder): void;
}

/**
 * Context options passed to a plugin during initialization.
 *
 * Plugin authors are responsible for casting their plugin context values
 * to this type.
 *
 * @internal
 */
export interface AzurePluginContext {
  cachePluginControl: CachePluginControl;
  nativeBrokerPluginControl: NativeBrokerPluginControl;
  vsCodeCredentialControl: VisualStudioCodeCredentialControl;
}
