// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Tracers and wrappers
export { createSpanFunction, CreateSpanFunctionArgs } from "./createSpan";

export {
  context,
  Context,
  ContextAPI,
  Exception,
  HrTime,
  isSpanContextValid,
  Link,
  Span,
  SpanAttributeValue,
  SpanAttributes,
  SpanContext,
  SpanKind,
  SpanOptions,
  SpanStatus,
  SpanStatusCode,
  TimeInput,
  TraceFlags,
  Tracer,
  TraceState
} from "@opentelemetry/api";
// Shared interfaces
export {
  // context,
  // Context,
  // ContextAPI,
  // Exception,
  // ExceptionWithCode,
  // ExceptionWithMessage,
  // ExceptionWithName,
  getSpan,
  getSpanContext,
  getTracer,
  // HrTime,
  // isSpanContextValid,
  // Link,
  OperationTracingOptions,
  setSpan,
  setSpanContext // Span,
} from // SpanAttributes,
// SpanAttributeValue,
// SpanContext,
// SpanKind,
// SpanOptions,
// SpanStatus,
// SpanStatusCode,
// TimeInput,
// TraceFlags,
// Tracer,
// TraceState
"./interfaces";

// Utilities
export {
  extractSpanContextFromTraceParentHeader,
  getTraceParentHeader
} from "./utils/traceParentHeader";
