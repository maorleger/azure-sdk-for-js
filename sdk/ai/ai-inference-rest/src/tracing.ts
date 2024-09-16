import { createTracingClient } from "@azure/core-tracing";

export const tracingClient = createTracingClient({
  namespace: "Microsoft.CognitiveServices",
  packageName: "@azure-rest/ai-inference"
})
