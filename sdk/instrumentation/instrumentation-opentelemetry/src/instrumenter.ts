// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Instrumenter,
  InstrumenterSpanOptions,
  TracingContext,
  TracingSpan,
  TracingSpanContext
} from "@azure/core-tracing";

import { trace, context } from "@opentelemetry/api";
import { createSpanWrapper } from "./spanWrapper";

import { toTraceparentHeader, toSpanOptions, fromTraceparentHeader } from "./transformations";

export class OpenTelemetryInstrumenter implements Instrumenter {
  startSpan(
    name: string,
    spanOptions: InstrumenterSpanOptions
  ): { span: TracingSpan; tracingContext: TracingContext } {
    const span = trace
      .getTracer(spanOptions.packageName, spanOptions.packageVersion)
      .startSpan(name, toSpanOptions(spanOptions));

    const ctx = spanOptions?.tracingContext || context.active();

    return {
      span: createSpanWrapper(span),
      tracingContext: trace.setSpan(ctx, span)
    };
  }
  withContext<
    CallbackArgs extends unknown[],
    Callback extends (...args: CallbackArgs) => ReturnType<Callback>
  >(
    tracingContext: TracingContext,
    callback: Callback,
    ...callbackArgs: CallbackArgs
  ): ReturnType<Callback> {
    return context.with(tracingContext, callback, undefined, ...callbackArgs);
  }

  parseTraceparentHeader(traceparentHeader: string): TracingSpanContext | undefined {
    return fromTraceparentHeader(traceparentHeader);
  }

  createRequestHeaders(spanContext: TracingSpanContext): Record<string, string> {
    const headers: Record<string, string> = {};
    const traceparentHeader = toTraceparentHeader(spanContext);
    if (traceparentHeader) {
      headers["traceparent"] = traceparentHeader;
    }

    return headers;
  }
}
