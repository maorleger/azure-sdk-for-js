/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */
import type {
  StopProtectionRequest,
  BackupInstancesStopProtectionOptionalParams,
} from "@azure/arm-dataprotection";
import { DataProtectionClient } from "@azure/arm-dataprotection";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

/**
 * This sample demonstrates how to This operation will stop protection of a backup instance and data will be held forever
 *
 * @summary This operation will stop protection of a backup instance and data will be held forever
 * x-ms-original-file: specification/dataprotection/resource-manager/Microsoft.DataProtection/stable/2024-04-01/examples/BackupInstanceOperations/StopProtection.json
 */
async function stopProtection(): Promise<void> {
  const subscriptionId =
    process.env["DATAPROTECTION_SUBSCRIPTION_ID"] || "04cf684a-d41f-4550-9f70-7708a3a2283b";
  const resourceGroupName = process.env["DATAPROTECTION_RESOURCE_GROUP"] || "testrg";
  const vaultName = "testvault";
  const backupInstanceName = "testbi";
  const credential = new DefaultAzureCredential();
  const client = new DataProtectionClient(credential, subscriptionId);
  const result = await client.backupInstances.beginStopProtectionAndWait(
    resourceGroupName,
    vaultName,
    backupInstanceName,
  );
  console.log(result);
}

/**
 * This sample demonstrates how to This operation will stop protection of a backup instance and data will be held forever
 *
 * @summary This operation will stop protection of a backup instance and data will be held forever
 * x-ms-original-file: specification/dataprotection/resource-manager/Microsoft.DataProtection/stable/2024-04-01/examples/BackupInstanceOperations/StopProtection_ResourceGuardEnabled.json
 */
async function stopProtectionWithMua(): Promise<void> {
  const subscriptionId =
    process.env["DATAPROTECTION_SUBSCRIPTION_ID"] || "04cf684a-d41f-4550-9f70-7708a3a2283b";
  const resourceGroupName = process.env["DATAPROTECTION_RESOURCE_GROUP"] || "testrg";
  const vaultName = "testvault";
  const backupInstanceName = "testbi";
  const parameters: StopProtectionRequest = {
    resourceGuardOperationRequests: [
      "/subscriptions/754ec39f-8d2a-44cf-bfbf-13107ac85c36/resourcegroups/mua-testing/providers/Microsoft.DataProtection/resourceGuards/gvjreddy-test-ecy-rg-reader/dppDisableStopProtectionRequests/default",
    ],
  };
  const options: BackupInstancesStopProtectionOptionalParams = { parameters };
  const credential = new DefaultAzureCredential();
  const client = new DataProtectionClient(credential, subscriptionId);
  const result = await client.backupInstances.beginStopProtectionAndWait(
    resourceGroupName,
    vaultName,
    backupInstanceName,
    options,
  );
  console.log(result);
}

async function main(): Promise<void> {
  await stopProtection();
  await stopProtectionWithMua();
}

main().catch(console.error);
