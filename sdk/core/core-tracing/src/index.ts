// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Tracers and wrappers
export { createSpanFunction, CreateSpanFunctionArgs } from "./createSpan";
export { TraceOptions, createTrace, withTrace } from "./createTrace";

// Shared interfaces
export {
  context,
  Context,
  ContextAPI,
  Exception,
  ExceptionWithCode,
  ExceptionWithMessage,
  ExceptionWithName,
  getSpan,
  getSpanContext,
  getTracer,
  HrTime,
  isSpanContextValid,
  Link,
  OperationTracingOptions,
  setSpan,
  setSpanContext,
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
  TraceState
} from "./interfaces";

// Utilities
export {
  extractSpanContextFromTraceParentHeader,
  getTraceParentHeader
} from "./utils/traceParentHeader";
