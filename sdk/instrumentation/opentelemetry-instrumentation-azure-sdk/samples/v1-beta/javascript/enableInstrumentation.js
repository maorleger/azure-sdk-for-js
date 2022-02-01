// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @summary Creates, reads, lists, and deletes keys.
 */
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { createAzureSdkInstrumentation } = require("@azure/opentelemetry-instrumentation-azure-sdk");
registerInstrumentations({ instrumentations: [createAzureSdkInstrumentation()] });
const { SampleClient } = require("./util/sampleClient");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { ConsoleSpanExporter, SimpleSpanProcessor } = require("@opentelemetry/tracing");

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

async function main() {
  console.log("provider", provider);
  const client = new SampleClient();
  await client.myClientMethod();
  console.log("done");
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});

module.exports = { main };
