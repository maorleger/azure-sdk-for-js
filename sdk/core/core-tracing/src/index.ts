// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Tracers and wrappers
export { createSpanFunction, CreateSpanFunctionArgs } from "./createSpan";

// Shared interfaces
import {
  context,
  Context,
  ContextAPI,
  Exception,
  HrTime,
  isSpanContextValid,
  Link,
  Span,
  SpanAttributes,
  SpanAttributeValue,
  SpanContext,
  SpanKind,
  SpanOptions,
  SpanStatus,
  SpanStatusCode,
  TimeInput,
  TraceFlags,
  Tracer,
  TraceState,
  trace
} from "@opentelemetry/api";

// Utilities
export {
  extractSpanContextFromTraceParentHeader,
  getTraceParentHeader
} from "./utils/traceParentHeader";

/**
 * Tracing options to set on an operation.
 */
export interface OperationTracingOptions {
  /**
   * OpenTelemetry SpanOptions used to create a span when tracing is enabled.
   * @deprecated
   */
  spanOptions?: unknown;

  /**
   * OpenTelemetry context to use for created Spans.
   */
  tracingContext?: Context;

  spanAttributes?: SpanAttributes;
}

export {
  context,
  Context,
  ContextAPI,
  Exception,
  HrTime,
  isSpanContextValid,
  Link,
  Span,
  SpanAttributes,
  SpanAttributeValue,
  SpanContext,
  SpanKind,
  SpanOptions,
  SpanStatus,
  SpanStatusCode,
  TimeInput,
  TraceFlags,
  Tracer,
  TraceState,
  trace
};

/**
 * Retrieves a tracer from the global tracer provider.
 */
export function getTracer(): Tracer;
/**
 * Retrieves a tracer from the global tracer provider.
 */
export function getTracer(name: string, version?: string): Tracer;
export function getTracer(name?: string, version?: string): Tracer {
  return trace.getTracer(name || "azure/core-tracing", version);
}

/**
 * Return the span if one exists
 *
 * @param context - context to get span from
 */
export function getSpan(context: Context): Span | undefined {
  return trace.getSpan(context);
}

/**
 * Set the span on a context
 *
 * @param context - context to use as parent
 * @param span - span to set active
 */
export function setSpan(context: Context, span: Span): Context {
  return trace.setSpan(context, span);
}

/**
 * Wrap span context in a NoopSpan and set as span in a new
 * context
 *
 * @param context - context to set active span on
 * @param spanContext - span context to be wrapped
 */
export function setSpanContext(context: Context, spanContext: SpanContext): Context {
  return trace.setSpanContext(context, spanContext);
}

/**
 * Get the span context of the span if it exists.
 *
 * @param context - context to get values from
 */
export function getSpanContext(context: Context): SpanContext | undefined {
  return trace.getSpanContext(context);
}
