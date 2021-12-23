// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { SpanStatus, TracingSpan } from "@azure/core-tracing";
import { Span, SpanStatusCode, SpanAttributeValue } from "@opentelemetry/api";

export function createSpanWrapper(span: Span): TracingSpan {
  const setAttribute = (key: string, value: SpanAttributeValue) => {
    if (value !== undefined && value !== null) {
      span.setAttribute(key, value);
    }
  };
  const setStatus = (status: SpanStatus) => {
    if (status.status === "error") {
      if (status.error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: status.error.toString() });
        recordException(status.error);
      } else {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
    } else if (status.status === "success") {
      span.setStatus({ code: SpanStatusCode.OK });
    }
  };
  const recordException = (error: Error | string): void => {
    span.recordException(error);
  };
  const end = () => {
    span.end();
  };
  const isRecording = () => span.isRecording();

  const spanWrapper = {
    end,
    get spanContext() {
      return span.spanContext();
    },
    isRecording,
    recordException,
    setAttribute,
    setStatus,
    unwrap: () => span
  };
  return spanWrapper;
}
