// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AuthorityValidationOptions } from "./authorityValidationOptions.js";
import { CredentialPersistenceOptions } from "./credentialPersistenceOptions.js";
import { MultiTenantTokenCredentialOptions } from "./multiTenantTokenCredentialOptions.js";

/**
 * Optional parameters for the {@link AzurePipelinesCredential} class.
 */
export interface AzurePipelinesCredentialOptions
  extends MultiTenantTokenCredentialOptions,
    CredentialPersistenceOptions,
    AuthorityValidationOptions {}
