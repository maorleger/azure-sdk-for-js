// import { setSpan, context as otContext, OperationTracingOptions } from "@azure/core-tracing";
// import { setTracer } from "@azure/test-utils";
// import { assert } from "chai";
import { OperationTracingOptions } from "@azure/core-tracing";

// const prefix = "Azure.KeyVault";

export async function supportsTracing(
  _callback: (tracingOptions: OperationTracingOptions) => Promise<unknown>,
  _children: string[]
): Promise<void> {
  return Promise.resolve();
}
