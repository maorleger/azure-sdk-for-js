/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import {
  MapsAccountUpdateParameters,
  AzureMapsManagementClient
} from "@azure/arm-maps";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

/**
 * This sample demonstrates how to Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 *
 * @summary Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 * x-ms-original-file: specification/maps/resource-manager/Microsoft.Maps/stable/2023-06-01/examples/UpdateAccountEncryption.json
 */
async function updateAccountEncryption(): Promise<void> {
  const subscriptionId =
    process.env["MAPS_SUBSCRIPTION_ID"] ||
    "21a9967a-e8a9-4656-a70b-96ff1c4d05a0";
  const resourceGroupName =
    process.env["MAPS_RESOURCE_GROUP"] || "myResourceGroup";
  const accountName = "myMapsAccount";
  const mapsAccountUpdateParameters: MapsAccountUpdateParameters = {
    encryption: {
      customerManagedKeyEncryption: {
        keyEncryptionKeyIdentity: {
          identityType: "systemAssignedIdentity",
          userAssignedIdentityResourceId: undefined
        },
        keyEncryptionKeyUrl:
          "https://contosovault.vault.azure.net/keys/contosokek"
      }
    },
    identity: {
      type: "SystemAssigned",
      userAssignedIdentities: {
        "/subscriptions/21a9967aE8a94656A70b96ff1c4d05a0/resourceGroups/myResourceGroup/providers/MicrosoftManagedIdentity/userAssignedIdentities/identityName": {}
      }
    }
  };
  const credential = new DefaultAzureCredential();
  const client = new AzureMapsManagementClient(credential, subscriptionId);
  const result = await client.accounts.update(
    resourceGroupName,
    accountName,
    mapsAccountUpdateParameters
  );
  console.log(result);
}

/**
 * This sample demonstrates how to Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 *
 * @summary Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 * x-ms-original-file: specification/maps/resource-manager/Microsoft.Maps/stable/2023-06-01/examples/UpdateAccountManagedIdentity.json
 */
async function updateAccountManagedIdentities(): Promise<void> {
  const subscriptionId =
    process.env["MAPS_SUBSCRIPTION_ID"] ||
    "21a9967a-e8a9-4656-a70b-96ff1c4d05a0";
  const resourceGroupName =
    process.env["MAPS_RESOURCE_GROUP"] || "myResourceGroup";
  const accountName = "myMapsAccount";
  const mapsAccountUpdateParameters: MapsAccountUpdateParameters = {
    identity: {
      type: "SystemAssigned, UserAssigned",
      userAssignedIdentities: {
        "/subscriptions/21a9967aE8a94656A70b96ff1c4d05a0/resourceGroups/myResourceGroup/providers/MicrosoftManagedIdentity/userAssignedIdentities/identityName": {}
      }
    },
    kind: "Gen2",
    linkedResources: [
      {
        id:
          "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/accounts/{storageName}",
        uniqueName: "myBatchStorageAccount"
      }
    ],
    sku: { name: "G2" }
  };
  const credential = new DefaultAzureCredential();
  const client = new AzureMapsManagementClient(credential, subscriptionId);
  const result = await client.accounts.update(
    resourceGroupName,
    accountName,
    mapsAccountUpdateParameters
  );
  console.log(result);
}

/**
 * This sample demonstrates how to Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 *
 * @summary Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 * x-ms-original-file: specification/maps/resource-manager/Microsoft.Maps/stable/2023-06-01/examples/UpdateAccount.json
 */
async function updateAccountTags(): Promise<void> {
  const subscriptionId =
    process.env["MAPS_SUBSCRIPTION_ID"] ||
    "21a9967a-e8a9-4656-a70b-96ff1c4d05a0";
  const resourceGroupName =
    process.env["MAPS_RESOURCE_GROUP"] || "myResourceGroup";
  const accountName = "myMapsAccount";
  const mapsAccountUpdateParameters: MapsAccountUpdateParameters = {
    tags: { specialTag: "true" }
  };
  const credential = new DefaultAzureCredential();
  const client = new AzureMapsManagementClient(credential, subscriptionId);
  const result = await client.accounts.update(
    resourceGroupName,
    accountName,
    mapsAccountUpdateParameters
  );
  console.log(result);
}

/**
 * This sample demonstrates how to Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 *
 * @summary Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 * x-ms-original-file: specification/maps/resource-manager/Microsoft.Maps/stable/2023-06-01/examples/UpdateAccountGen1.json
 */
async function updateToGen1Account(): Promise<void> {
  const subscriptionId =
    process.env["MAPS_SUBSCRIPTION_ID"] ||
    "21a9967a-e8a9-4656-a70b-96ff1c4d05a0";
  const resourceGroupName =
    process.env["MAPS_RESOURCE_GROUP"] || "myResourceGroup";
  const accountName = "myMapsAccount";
  const mapsAccountUpdateParameters: MapsAccountUpdateParameters = {
    kind: "Gen1",
    sku: { name: "S1" }
  };
  const credential = new DefaultAzureCredential();
  const client = new AzureMapsManagementClient(credential, subscriptionId);
  const result = await client.accounts.update(
    resourceGroupName,
    accountName,
    mapsAccountUpdateParameters
  );
  console.log(result);
}

/**
 * This sample demonstrates how to Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 *
 * @summary Updates a Maps Account. Only a subset of the parameters may be updated after creation, such as Sku, Tags, Properties.
 * x-ms-original-file: specification/maps/resource-manager/Microsoft.Maps/stable/2023-06-01/examples/UpdateAccountGen2.json
 */
async function updateToGen2Account(): Promise<void> {
  const subscriptionId =
    process.env["MAPS_SUBSCRIPTION_ID"] ||
    "21a9967a-e8a9-4656-a70b-96ff1c4d05a0";
  const resourceGroupName =
    process.env["MAPS_RESOURCE_GROUP"] || "myResourceGroup";
  const accountName = "myMapsAccount";
  const mapsAccountUpdateParameters: MapsAccountUpdateParameters = {
    kind: "Gen2",
    sku: { name: "G2" }
  };
  const credential = new DefaultAzureCredential();
  const client = new AzureMapsManagementClient(credential, subscriptionId);
  const result = await client.accounts.update(
    resourceGroupName,
    accountName,
    mapsAccountUpdateParameters
  );
  console.log(result);
}

async function main(): Promise<void> {
  updateAccountEncryption();
  updateAccountManagedIdentities();
  updateAccountTags();
  updateToGen1Account();
  updateToGen2Account();
}

main().catch(console.error);
