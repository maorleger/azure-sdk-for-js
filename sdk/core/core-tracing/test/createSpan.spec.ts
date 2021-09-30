// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { assert } from "chai";
import {
  setSpan,
  SpanKind,
  context as otContext,
  getSpanContext,
  Context,
  Span
} from "../src/interfaces";

import { createSpanFunction, isTracingDisabled, knownSpanAttributes } from "../src/createSpan";
import { OperationTracingOptions } from "../src/interfaces";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
  InMemorySpanExporter
} from "@opentelemetry/sdk-trace-base";

describe.only("createSpan", () => {
  let createSpan: ReturnType<typeof createSpanFunction>;
  const spanExporter = new InMemorySpanExporter();
  const tracerProvider = new BasicTracerProvider();
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(spanExporter));
  tracerProvider.register();
  createSpan = createSpanFunction({ namespace: "Microsoft.Test", packagePrefix: "Azure.Test" });

  beforeEach(() => {
    spanExporter.reset();
  });

  it("is backwards compatible at runtime with versions prior to preview.13", () => {
    const testSpan = tracerProvider.getTracer("test").startSpan("test");
    const someContext = setSpan(otContext.active(), testSpan);

    // Ensure we are backwards compatible with { tracingOptions: { spanOptions } } shape which was
    // used prior to preview.13 for setting span options.
    const options = {
      tracingOptions: {
        tracingContext: someContext,
        spanOptions: {
          kind: SpanKind.CLIENT,
          attributes: {
            foo: "bar"
          }
        }
      }
    };

    const expectedSpanOptions = {
      kind: SpanKind.CLIENT,
      attributes: {
        foo: "bar",
        "az.namespace": "Microsoft.Test"
      }
    };

    const { span, updatedOptions } = createSpan("testMethod", options);
    span.end();
    assert.deepEqual(updatedOptions.tracingOptions.spanOptions, expectedSpanOptions);
    const finishedSpan = spanExporter.getFinishedSpans()[0];
    assert.equal(finishedSpan.kind, SpanKind.CLIENT);
    assert.equal(finishedSpan.attributes.foo, "bar");

    assert.equal(
      updatedOptions.tracingOptions.tracingContext.getValue(
        knownSpanAttributes.AZ_NAMESPACE.contextKey
      ),
      "Microsoft.Test"
    );
  });

  it("returns a created span with the right metadata", () => {
    const testSpan = tracerProvider.getTracer("test").startSpan("testing");

    const someContext = setSpan(otContext.active(), testSpan);

    const { span, updatedOptions } = createSpan(
      "testMethod",
      {
        // validate that we dumbly just copy any fields (this makes future upgrades easier)
        someOtherField: "someOtherFieldValue",
        tracingOptions: {
          // validate that we dumbly just copy any fields (this makes future upgrades easier)
          someOtherField: "someOtherFieldValue",
          tracingContext: someContext
        }
      },
      { kind: SpanKind.SERVER }
    );
    span.end();

    const finishedSpan = spanExporter.getFinishedSpans()[0];
    assert.strictEqual(finishedSpan.name, "Azure.Test.testMethod");
    assert.equal(finishedSpan.attributes["az.namespace"], "Microsoft.Test");

    assert.equal(updatedOptions.someOtherField, "someOtherFieldValue");
    assert.equal(updatedOptions.tracingOptions.someOtherField, "someOtherFieldValue");

    assert.equal(finishedSpan.kind, SpanKind.SERVER);
    assert.equal(
      updatedOptions.tracingOptions.tracingContext.getValue(Symbol.for("az.namespace")),
      "Microsoft.Test"
    );
  });

  it("preserves existing attributes", () => {
    const testSpan = tracerProvider.getTracer("test").startSpan("testing");

    const someContext = setSpan(otContext.active(), testSpan).setValue(
      Symbol.for("someOtherKey"),
      "someOtherValue"
    );

    const { span, updatedOptions } = createSpan("testMethod", {
      someTopLevelField: "someTopLevelFieldValue",
      tracingOptions: {
        someOtherTracingField: "someOtherTracingValue",
        tracingContext: someContext
      }
    });
    span.end();

    const finishedSpan = spanExporter.getFinishedSpans()[0];
    assert.strictEqual(finishedSpan.name, "Azure.Test.testMethod");
    assert.equal(finishedSpan.attributes["az.namespace"], "Microsoft.Test");

    assert.equal(
      updatedOptions.tracingOptions.tracingContext.getValue(Symbol.for("someOtherKey")),
      "someOtherValue"
    );
    assert.equal(updatedOptions.someTopLevelField, "someTopLevelFieldValue");
    assert.equal(updatedOptions.tracingOptions.someOtherTracingField, "someOtherTracingValue");
  });

  it("namespace and packagePrefix can be empty (and thus ignored)", () => {
    const cf = createSpanFunction({
      namespace: "",
      packagePrefix: ""
    });

    const { span, updatedOptions } = cf("myVerbatimOperationName", {} as any, {
      attributes: {
        testAttribute: "testValue"
      }
    });
    span.end();

    const finishedSpan = spanExporter.getFinishedSpans()[0];

    assert.equal(
      finishedSpan.name,
      "myVerbatimOperationName",
      "Expected name to not change because there is no packagePrefix."
    );
    assert.notExists(
      finishedSpan.attributes["az.namespace"],
      "Expected az.namespace not to be set because there is no namespace"
    );

    assert.notExists(
      updatedOptions.tracingOptions.tracingContext?.getValue(Symbol.for("az.namespace"))
    );
  });

  it("createSpans, testing parent/child relationship", () => {
    const createSpanFn = createSpanFunction({
      namespace: "Microsoft.Test",
      packagePrefix: "Azure.Test"
    });

    let parentContext: Context;

    // create the parent span and do some basic checks.
    {
      const op: { tracingOptions: OperationTracingOptions } = {
        tracingOptions: {}
      };

      const { span, updatedOptions } = createSpanFn("parent", op);
      assert.ok(span);
      span.end();

      parentContext = updatedOptions.tracingOptions!.tracingContext!;

      assert.ok(parentContext);
      assert.notDeepEqual(parentContext, otContext.active(), "new child context should be created");
      assert.equal(
        getSpanContext(parentContext!)?.spanId,
        span.spanContext().spanId,
        "context returned in the updated options should point to our newly created span"
      );
    }

    const { span: childSpan, updatedOptions } = createSpanFn("child", {
      tracingOptions: {
        tracingContext: parentContext
      }
    });
    assert.ok(childSpan);
    childSpan.end();

    assert.ok(updatedOptions.tracingOptions.tracingContext);
    assert.equal(
      getSpanContext(updatedOptions.tracingOptions.tracingContext!)?.spanId,
      childSpan.spanContext().spanId
    );
  });

  it("is robust when no options are passed in", () => {
    const { span, updatedOptions } = <{ span: Span; updatedOptions: any }>createSpan("foo");
    assert.exists(span);
    assert.exists(updatedOptions);
    assert.exists(updatedOptions.tracingOptions.spanOptions);
    assert.exists(updatedOptions.tracingOptions.tracingContext);
  });

  it("returns a no-op tracer if AZURE_TRACING_DISABLED is set", function(this: Mocha.Context) {
    if (typeof process === "undefined") {
      this.skip();
    }
    process.env.AZURE_TRACING_DISABLED = "true";

    const testSpan = tracerProvider.getTracer("test").startSpan("testing");

    const someContext = setSpan(otContext.active(), testSpan);

    const { span } = createSpan("testMethod", {
      tracingOptions: ({
        // validate that we dumbly just copy any fields (this makes future upgrades easier)
        someOtherField: "someOtherFieldValue",
        tracingContext: someContext,
        spanOptions: {
          kind: SpanKind.SERVER
        }
      } as OperationTracingOptions) as any
    });
    assert.isFalse(span.isRecording());
    delete process.env.AZURE_TRACING_DISABLED;
  });

  describe("IsTracingDisabled", () => {
    beforeEach(function(this: Mocha.Context) {
      if (typeof process === "undefined") {
        this.skip();
      }
    });
    it("is false when env var is blank or missing", () => {
      process.env.AZURE_TRACING_DISABLED = "";
      assert.isFalse(isTracingDisabled());
      delete process.env.AZURE_TRACING_DISABLED;
      assert.isFalse(isTracingDisabled());
    });

    it("is false when env var is 'false'", () => {
      process.env.AZURE_TRACING_DISABLED = "false";
      assert.isFalse(isTracingDisabled());
      process.env.AZURE_TRACING_DISABLED = "False";
      assert.isFalse(isTracingDisabled());
      process.env.AZURE_TRACING_DISABLED = "FALSE";
      assert.isFalse(isTracingDisabled());
      delete process.env.AZURE_TRACING_DISABLED;
    });

    it("is false when env var is 0", () => {
      process.env.AZURE_TRACING_DISABLED = "0";
      assert.isFalse(isTracingDisabled());
      delete process.env.AZURE_TRACING_DISABLED;
    });

    it("is true otherwise", () => {
      process.env.AZURE_TRACING_DISABLED = "true";
      assert.isTrue(isTracingDisabled());
      process.env.AZURE_TRACING_DISABLED = "1";
      assert.isTrue(isTracingDisabled());
      delete process.env.AZURE_TRACING_DISABLED;
    });
  });
});
