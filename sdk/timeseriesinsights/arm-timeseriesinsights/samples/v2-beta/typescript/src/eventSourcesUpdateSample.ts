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
  EventSourceUpdateParametersUnion,
  TimeSeriesInsightsClient
} from "@azure/arm-timeseriesinsights";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

/**
 * This sample demonstrates how to Updates the event source with the specified name in the specified subscription, resource group, and environment.
 *
 * @summary Updates the event source with the specified name in the specified subscription, resource group, and environment.
 * x-ms-original-file: specification/timeseriesinsights/resource-manager/Microsoft.TimeSeriesInsights/preview/2021-03-31-preview/examples/EventSourcesPatchTags.json
 */
async function updateEventSource(): Promise<void> {
  const subscriptionId =
    process.env["TIMESERIESINSIGHTS_SUBSCRIPTION_ID"] || "subid";
  const resourceGroupName =
    process.env["TIMESERIESINSIGHTS_RESOURCE_GROUP"] || "rg1";
  const environmentName = "env1";
  const eventSourceName = "es1";
  const eventSourceUpdateParameters: EventSourceUpdateParametersUnion = {
    kind: "Microsoft.EventHub",
    tags: { someKey: "someValue" }
  };
  const credential = new DefaultAzureCredential();
  const client = new TimeSeriesInsightsClient(credential, subscriptionId);
  const result = await client.eventSources.update(
    resourceGroupName,
    environmentName,
    eventSourceName,
    eventSourceUpdateParameters
  );
  console.log(result);
}

async function main(): Promise<void> {
  updateEventSource();
}

main().catch(console.error);
