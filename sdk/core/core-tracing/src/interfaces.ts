// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as openTelemetry from "@opentelemetry/api";

/**
 * Return the span if one exists
 *
 * @param context - context to get span from
 */
export function getSpan(context: openTelemetry.Context): openTelemetry.Span | undefined {
  return openTelemetry.trace.getSpan(context);
}

/**
 * Set the span on a context
 *
 * @param context - context to use as parent
 * @param span - span to set active
 */
export function setSpan(
  context: openTelemetry.Context,
  span: openTelemetry.Span
): openTelemetry.Context {
  return openTelemetry.trace.setSpan(context, span);
}

/**
 * Wrap span context in a NoopSpan and set as span in a new
 * context
 *
 * @param context - context to set active span on
 * @param spanContext - span context to be wrapped
 */
export function setSpanContext(
  context: openTelemetry.Context,
  spanContext: openTelemetry.SpanContext
): openTelemetry.Context {
  return openTelemetry.trace.setSpanContext(context, spanContext);
}

/**
 * Get the span context of the span if it exists.
 *
 * @param context - context to get values from
 */
export function getSpanContext(
  context: openTelemetry.Context
): openTelemetry.SpanContext | undefined {
  return openTelemetry.trace.getSpanContext(context);
}

/**
 * Retrieves a tracer from the global tracer provider.
 */
export function getTracer(): openTelemetry.Tracer;
/**
 * Retrieves a tracer from the global tracer provider.
 */
export function getTracer(name: string, version?: string): openTelemetry.Tracer;
export function getTracer(name?: string, version?: string): openTelemetry.Tracer {
  return openTelemetry.trace.getTracer(name || "azure/core-tracing", version);
}

/**
 * Tracing options to set on an operation.
 */
export interface OperationTracingOptions {
  /**
   * OpenTelemetry context to use for created Spans.
   */
  tracingContext?: openTelemetry.Context;
}

export * from "@opentelemetry/api";
