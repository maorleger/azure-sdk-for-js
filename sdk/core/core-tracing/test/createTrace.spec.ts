import { OperationTracingOptions, SpanStatusCode, withTrace } from "../src";
import { context, Context, trace, Span } from "@opentelemetry/api";
import { assert } from "chai";
import { TestContextManager } from "./util/testContextManager";
import {
  InMemorySpanExporter,
  BasicTracerProvider,
  SimpleSpanProcessor
} from "@opentelemetry/sdk-trace-base";

describe("createTrace", () => {
  let ctx: Context;
  const spanExporter = new InMemorySpanExporter();
  const tracerProvider = new BasicTracerProvider();
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(spanExporter));
  tracerProvider.register({ contextManager: new TestContextManager() });
  const tracer = tracerProvider.getTracer("azure/core-tracing");

  beforeEach(() => {
    spanExporter.reset();
    const span = tracer.startSpan("root");
    ctx = trace.setSpan(context.active(), span);
  });

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

      it("successfully creates a span", async () => {
        await withTrace("spanName", {}, () => Promise.resolve());
        const finishedSpans = spanExporter.getFinishedSpans();
        assert.equal(finishedSpans.length, 1);
        assert.equal(finishedSpans[0].name, "spanName");
        assert.equal(finishedSpans[0].status.code, SpanStatusCode.OK);
      });

      it("successfully records an exception on the span", async () => {
        try {
          await withTrace("spanName", {}, () => {
            throw new Error("test error");
          });
        } catch {}

        const finishedSpans = spanExporter.getFinishedSpans();
        assert.equal(finishedSpans.length, 1);
        const span = finishedSpans[0];
        assert.equal(span.name, "spanName");
        assert.deepEqual(span.status, {
          code: SpanStatusCode.ERROR,
          message: "test error"
        });
        assert.equal(span.events.length, 1);
        const exceptionEvent = span.events[0];
        assert.equal(exceptionEvent.name, "exception");
        assert.equal(exceptionEvent.attributes!["exception.message"], "test error");
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
      let tracingOptions: OperationTracingOptions = {};

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

      it("successfully creates a span", async () => {
        await withTrace("spanName", {}, () => Promise.resolve());
        const finishedSpans = spanExporter.getFinishedSpans();
        assert.equal(finishedSpans.length, 1);
        assert.equal(finishedSpans[0].name, "spanName");
        assert.equal(finishedSpans[0].status.code, SpanStatusCode.OK);
      });

      it("successfully records an exception on the span", async () => {
        try {
          await withTrace("spanName", {}, () => {
            throw new Error("test error");
          });
        } catch {}

        const finishedSpans = spanExporter.getFinishedSpans();
        assert.equal(finishedSpans.length, 1);
        const span = finishedSpans[0];
        assert.equal(span.name, "spanName");
        assert.deepEqual(span.status, {
          code: SpanStatusCode.ERROR,
          message: "test error"
        });
        assert.equal(span.events.length, 1);
        const exceptionEvent = span.events[0];
        assert.equal(exceptionEvent.name, "exception");
        assert.equal(exceptionEvent.attributes!["exception.message"], "test error");
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
  });
});
