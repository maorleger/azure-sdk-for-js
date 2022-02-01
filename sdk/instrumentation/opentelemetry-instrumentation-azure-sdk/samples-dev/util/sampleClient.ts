// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createTracingClient, OperationTracingOptions, TracingClient } from "@azure/core-tracing";

export class SampleClient {
  private tracingClient: TracingClient;
  constructor() {
    this.tracingClient = createTracingClient({
      namespace: "Microsoft.Sample",
      packageName: "@azure/opentelemetry-instrumentation-azure-sdk",
    });
  }

  myClientMethod(options: MyClientMethodOptions = {}) {
    return this.tracingClient.withSpan(
      [SampleClient.name, this.myClientMethod.name].join("."),
      options,
      (_, span) => {
        console.log("span", span.isRecording.toString());
      }
    );
  }
}

export interface MyClientMethodOptions {
  tracingOptions?: OperationTracingOptions;
}
