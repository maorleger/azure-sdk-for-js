import { createTrace } from "../src/createTrace";
import { setSpan, context as otContext, SpanKind } from "@opentelemetry/api";

import { setTracer } from "../src/tracerProxy";
import { TestTracer } from "../src/tracers/test/testTracer";
import { assert } from "chai";
import { OperationTracingOptions, TestSpan } from "../src";

describe.only("createTrace", () => {
  describe("when tracing is enabled", () => {
    const tracer = new TestTracer();
    setTracer(tracer);
    const rootSpan = tracer.startSpan("root");
    const context = setSpan(otContext.active(), rootSpan);
    const withTrace = createTrace("Microsoft.TestNamespace", "Azure.TestService.TestClient");

    it("creates a span with the right metadata", async () => {
      let testSpan: TestSpan | undefined = undefined;
      let tracingOptions: OperationTracingOptions = {};
      const startTime = 1234567;
      await withTrace(
        "testOperation",
        {
          tracingOptions: {
            tracingContext: context,
            spanOptions: { kind: SpanKind.INTERNAL, startTime: startTime }
          }
        },
        (optionsWithTrace, span) => {
          tracingOptions = optionsWithTrace.tracingOptions;
          testSpan = span as TestSpan;
          return Promise.resolve();
        }
      );
      // test span
      assert.deepInclude(testSpan!, {
        name: "Azure.TestService.TestClient.testOperation",
        startTime,
        attributes: {
          "az.namespace": "Microsoft.TestNamespace"
        }
      });

      // TOOD: move to another test
      assert.equal(tracingOptions.spanOptions?.kind, SpanKind.INTERNAL);
      assert.equal(tracingOptions.spanOptions?.startTime, startTime);
    });
    it("provides access to the span in callback");
    it("merges tracing options while preserving existing options");
    describe("with a successful operation", () => {
      it("successfully ends the span");
      it("sets successful status");
    });

    describe("with an error", () => {
      it("successfully ends the span");
      it("records the exception");
      it("sets the error status");
    });
  });
});
