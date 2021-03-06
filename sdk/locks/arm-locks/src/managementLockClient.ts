/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import * as coreAuth from "@azure/core-auth";
import { AuthorizationOperationsImpl, ManagementLocksImpl } from "./operations";
import {
  AuthorizationOperations,
  ManagementLocks
} from "./operationsInterfaces";
import { ManagementLockClientContext } from "./managementLockClientContext";
import { ManagementLockClientOptionalParams } from "./models";

export class ManagementLockClient extends ManagementLockClientContext {
  /**
   * Initializes a new instance of the ManagementLockClient class.
   * @param credentials Subscription credentials which uniquely identify client subscription.
   * @param subscriptionId The ID of the target subscription.
   * @param options The parameter options
   */
  constructor(
    credentials: coreAuth.TokenCredential,
    subscriptionId: string,
    options?: ManagementLockClientOptionalParams
  ) {
    super(credentials, subscriptionId, options);
    this.authorizationOperations = new AuthorizationOperationsImpl(this);
    this.managementLocks = new ManagementLocksImpl(this);
  }

  authorizationOperations: AuthorizationOperations;
  managementLocks: ManagementLocks;
}
