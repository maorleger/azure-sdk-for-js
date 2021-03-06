/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

import * as msRest from "@azure/ms-rest-js";
import { TokenCredential } from "@azure/core-auth";
import * as Models from "./models";
import * as Mappers from "./models/mappers";
import * as operations from "./operations";
import { DataLakeAnalyticsAccountManagementClientContext } from "./dataLakeAnalyticsAccountManagementClientContext";


class DataLakeAnalyticsAccountManagementClient extends DataLakeAnalyticsAccountManagementClientContext {
  // Operation groups
  accounts: operations.Accounts;
  dataLakeStoreAccounts: operations.DataLakeStoreAccounts;
  storageAccounts: operations.StorageAccounts;
  computePolicies: operations.ComputePolicies;
  firewallRules: operations.FirewallRules;
  operations: operations.Operations;
  locations: operations.Locations;

  /**
   * Initializes a new instance of the DataLakeAnalyticsAccountManagementClient class.
   * @param credentials Credentials needed for the client to connect to Azure. Credentials
   * implementing the TokenCredential interface from the @azure/identity package are recommended. For
   * more information about these credentials, see
   * {@link https://www.npmjs.com/package/@azure/identity}. Credentials implementing the
   * ServiceClientCredentials interface from the older packages @azure/ms-rest-nodeauth and
   * @azure/ms-rest-browserauth are also supported.
   * @param subscriptionId Get subscription credentials which uniquely identify Microsoft Azure
   * subscription. The subscription ID forms part of the URI for every service call.
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials | TokenCredential, subscriptionId: string, options?: Models.DataLakeAnalyticsAccountManagementClientOptions) {
    super(credentials, subscriptionId, options);
    this.accounts = new operations.Accounts(this);
    this.dataLakeStoreAccounts = new operations.DataLakeStoreAccounts(this);
    this.storageAccounts = new operations.StorageAccounts(this);
    this.computePolicies = new operations.ComputePolicies(this);
    this.firewallRules = new operations.FirewallRules(this);
    this.operations = new operations.Operations(this);
    this.locations = new operations.Locations(this);
  }
}

// Operation Specifications

export {
  DataLakeAnalyticsAccountManagementClient,
  DataLakeAnalyticsAccountManagementClientContext,
  Models as DataLakeAnalyticsAccountManagementModels,
  Mappers as DataLakeAnalyticsAccountManagementMappers
};
export * from "./operations";
