import { withTrace } from "../src";
import { context, Context, trace, Span } from "@opentelemetry/api";
import { assert } from "chai";
import { TestTracerProvider } from "./util/testTracerProvider";

describe("createTrace", () => {
  let ctx: Context;
  beforeEach(() => {
    const tracerProvider = new TestTracerProvider();
    tracerProvider.register();
    const tracer = trace.getTracer("azure/core-tracing");
    const span = tracer.startSpan("root");
    ctx = trace.setSpan(context.active(), span);
  });
  describe("#createTrace", () => {});
  describe("#withTrace", () => {
    describe("with tracingContext", () => {
      let tracingOptions: { tracingContext: Context };
      beforeEach(() => {
        tracingOptions = {
          tracingContext: ctx
        };
      });

      it("updates tracingOptions with a new context", async () => {
        const updatedOptions = await withTrace("spanName", { tracingOptions }, (updatedOptions) => {
          return Promise.resolve(updatedOptions);
        });
        assert.exists(updatedOptions.tracingOptions);
        assert.notEqual(
          updatedOptions.tracingOptions?.tracingContext,
          tracingOptions.tracingContext
        );
      });
      it("allows tracing to be configured correctly", async () => {
        await withTrace("spanName", {}, (_updatedOptions, _span) => {
          return Promise.resolve();
        });
      });

      it("sets the new span as active", async () => {
        let activeSpanInCallback: Span | undefined;
        let activeSpanFromContext: Span | undefined;

        await withTrace("spanName", { tracingOptions }, (_updatedOptions, span) => {
          activeSpanInCallback = span;
          activeSpanFromContext = trace.getSpan(context.active());
          return Promise.resolve();
        });

        assert.exists(activeSpanInCallback);
        assert.equal(activeSpanInCallback, activeSpanFromContext);
      });
    });

    describe("without tracingContext", () => {
      it("updates tracingOptions with a new context", async () => {
        const updatedOptions = await withTrace(
          "spanName",
          { tracingOptions: { tracingContext: undefined } },
          (updatedOptions) => {
            return Promise.resolve(updatedOptions);
          }
        );
        assert.exists(updatedOptions.tracingOptions?.tracingContext);
      });
      it("allows tracing to be configured correctly");

      it("sets the new span as active", async () => {
        let activeSpanInCallback: Span | undefined;
        let activeSpanFromContext: Span | undefined;

        await withTrace(
          "spanName",
          { tracingOptions: { tracingContext: undefined } },
          (_updatedOptions, span) => {
            activeSpanInCallback = span;
            activeSpanFromContext = trace.getSpan(context.active());
            return Promise.resolve();
          }
        );

        assert.exists(activeSpanInCallback);
        assert.equal(activeSpanInCallback, activeSpanFromContext);
      });
    });
  });
});
