import { createTrace } from "../src/createTrace";
import { setSpan, context as otContext, SpanKind, Context, Tracer } from "@opentelemetry/api";

import { getTracer, setTracer } from "../src/tracerProxy";
import { TestTracer } from "../src/tracers/test/testTracer";
import { assert } from "chai";
import { SpanStatusCode, TestSpan } from "../src";

describe("createTrace", () => {
  let context: Context;
  let existingTracer: Tracer;
  let testTracer: TestTracer;
  let rootSpan: TestSpan;
  const withTrace = createTrace("Microsoft.TestNamespace", "Azure.TestService.TestClient");

  describe("when tracing is enabled", () => {
    beforeEach(() => {
      testTracer = new TestTracer();
      existingTracer = getTracer();
      setTracer(testTracer);
      rootSpan = testTracer.startSpan("createTraceRootSpan");
      context = setSpan(otContext.active(), rootSpan);
    });

    afterEach(() => {
      setTracer(existingTracer);
    });

    it("creates a span with the right metadata", async () => {
      let testSpan: TestSpan | undefined = undefined;
      const startTime = 1234567;
      await withTrace(
        "testOperation",
        {
          tracingOptions: {
            tracingContext: context,
            spanOptions: {
              startTime
            }
          }
        },
        (_options, span) => {
          testSpan = span as TestSpan;
          return Promise.resolve();
        }
      );
      assert.isTrue(testSpan!.isRecording());
      // test span
      assert.deepInclude(testSpan!, {
        name: "Azure.TestService.TestClient.testOperation",
        startTime,
        attributes: {
          "az.namespace": "Microsoft.TestNamespace"
        }
      });
    });

    it("provides access to the span in callback", async () => {
      let testSpan: TestSpan | undefined = undefined;
      await withTrace(
        "testOperation",
        { tracingOptions: { tracingContext: context } },
        (_options, span) => {
          span.setAttribute("test", "value");
          testSpan = span as TestSpan;
          return Promise.resolve();
        }
      );
      assert.equal(testSpan!.attributes["test"], "value");
    });

    it("merges tracing options while preserving existing options", async () => {
      let options: any = {};
      await withTrace(
        "testOperation",
        {
          tracingOptions: { tracingContext: context, spanOptions: { kind: SpanKind.PRODUCER } },
          otherOptions: { foo: "bar" }
        },
        (optionsWithTrace) => {
          options = optionsWithTrace;
          return Promise.resolve();
        }
      );

      assert.equal(options.otherOptions.foo, "bar");
      assert.equal(options.tracingOptions.spanOptions.kind, SpanKind.PRODUCER);
    });

    describe("with a successful operation", () => {
      it("successfully ends the span with the right status", async () => {
        let testSpan: TestSpan | undefined = undefined;
        await withTrace(
          "testOperation",
          { tracingOptions: { tracingContext: context } },
          (_options, span) => {
            testSpan = span as TestSpan;
            return Promise.resolve();
          }
        );

        assert.deepEqual(testSpan!.status, { code: SpanStatusCode.OK });
        assert.isTrue(testSpan!.endCalled);
      });

      it("works end-to-end", async () => {
        await withTrace("testOperation", { tracingOptions: { tracingContext: context } }, () =>
          Promise.resolve()
        );
        rootSpan.end();

        let rootSpans = testTracer.getRootSpans();
        assert.equal(rootSpans.length, 1);
        const spanGraph = testTracer.getSpanGraph(rootSpans[0].context().traceId);
        assert.sameMembers(
          spanGraph.roots[0].children.map((c) => c.name),
          ["Azure.TestService.TestClient.testOperation"]
        );
        assert.equal(testTracer.getActiveSpans().length, 0);
      });
    });

    describe("with an error", () => {
      it("ends the span and records the exception", async () => {
        const error = new Error("oh my!");
        let testSpan: TestSpan | undefined = undefined;
        try {
          await withTrace(
            "testOperation",
            { tracingOptions: { tracingContext: context } },
            (_options, span) => {
              testSpan = span as TestSpan;
              throw error;
            }
          );
        } catch {}

        assert.deepEqual(testSpan!.status, { code: SpanStatusCode.ERROR, message: "oh my!" });
        assert.equal(testSpan!.exception, error);
        assert.isTrue(testSpan!.endCalled);
      });

      it("works end-to-end", async () => {
        try {
          await withTrace("testOperation", { tracingOptions: { tracingContext: context } }, () =>
            Promise.resolve()
          );
        } catch {}

        rootSpan.end();
        let rootSpans = testTracer.getRootSpans();
        assert.equal(rootSpans.length, 1);
        const spanGraph = testTracer.getSpanGraph(rootSpans[0].context().traceId);
        assert.sameMembers(
          spanGraph.roots[0].children.map((c) => c.name),
          ["Azure.TestService.TestClient.testOperation"]
        );
        assert.equal(testTracer.getActiveSpans().length, 0);
      });
    });
  });

  describe("when tracing is disabled", () => {
    it("no-ops", async () => {
      let testSpan: TestSpan | undefined = undefined;
      const startTime = 1234567;
      await withTrace(
        "testOperation",
        {
          tracingOptions: {
            tracingContext: context,
            spanOptions: {
              startTime
            }
          }
        },
        (_options, span) => {
          testSpan = span as TestSpan;
          return Promise.resolve();
        }
      );
      assert.isFalse(testSpan!.isRecording());
    });
  });
});
