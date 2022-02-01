// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @summary Creates, reads, lists, and deletes keys.
 */
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { createAzureSdkInstrumentation } from "@azure/opentelemetry-instrumentation-azure-sdk";
registerInstrumentations({ instrumentations: [createAzureSdkInstrumentation()] });
import { SampleClient } from "./util/sampleClient";
import { NodeTracerProvider } from "@opentelemetry/node";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/tracing";

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

export async function main(): Promise<void> {
  console.log("provider", provider);
  const client = new SampleClient();
  await client.myClientMethod();
  console.log("done");
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
