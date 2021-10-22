// import { createTracingClient, useTracer } from "../src";
// import { OpenTelemetryTracer } from "../src/otelTracer";
// import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
// import { SimpleSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";

// describe("Tracer", () => {
//   it("works...", async () => {
//     const tracer = new OpenTelemetryTracer();
//     const provider = new NodeTracerProvider();
//     provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
//     provider.register();
//     useTracer(tracer);
//     const tracingClient = createTracingClient({ namespace: "my-namespace" });

//     const result = await tracingClient.withTrace("outer", (updatedOptions, span) => {
//       span.setAttribute("outer", "outer");
//       return tracingClient.withTrace(
//         "inner",
//         (updatedOptions, span) => {
//           span.setAttribute("inner", "inner");
//           return Promise.resolve("inner");
//         },
//         updatedOptions
//       );
//     });
//     console.log(result);
//   });
// });
