// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Tracers and wrappers
export { createSpanFunction, CreateSpanFunctionArgs } from "./createSpan";

// export * from "@opentelemetry/api";
// Shared interfaces
export * from "./interfaces";

// Utilities
export {
  extractSpanContextFromTraceParentHeader,
  getTraceParentHeader
} from "./utils/traceParentHeader";
