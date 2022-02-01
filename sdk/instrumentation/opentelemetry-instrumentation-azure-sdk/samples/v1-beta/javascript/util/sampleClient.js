// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const { createTracingClient } = require("@azure/core-tracing");

class SampleClient {
  tracingClient;
  constructor() {
    this.tracingClient = createTracingClient({
      namespace: "Microsoft.Sample",
      packageName: "@azure/opentelemetry-instrumentation-azure-sdk",
    });
  }

  myClientMethod(options = {}) {
    return this.tracingClient.withSpan(
      [SampleClient.name, this.myClientMethod.name].join("."),
      options,
      (_, span) => {
        console.log("span", span.isRecording.toString());
      }
    );
  }
}

module.exports = { SampleClient };
