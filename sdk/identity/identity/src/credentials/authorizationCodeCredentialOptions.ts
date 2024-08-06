// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AuthorityValidationOptions } from "./authorityValidationOptions.js";
import { MultiTenantTokenCredentialOptions } from "./multiTenantTokenCredentialOptions.js";

/**
 * Options for the {@link AuthorizationCodeCredential}
 */
export interface AuthorizationCodeCredentialOptions
  extends MultiTenantTokenCredentialOptions,
    AuthorityValidationOptions {}
