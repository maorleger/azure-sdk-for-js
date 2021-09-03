import { trace } from "@opentelemetry/api";
import {
  OperationTracingOptions,
  Span,
  context,
  SpanStatusCode,
  SpanAttributes,
  Link,
  SpanKind,
  TimeInput,
  SpanOptions
} from "./interfaces";
import { knownSpanAttributes } from "./createSpan";

/**
 * Options for configuring tracing using OpenTelemetry.
 */
export interface TraceOptions {
  /**
   * The value of the `az.namespace` attribute on the created span.
   */
  azureNamespace: string;
  /**
   * The package name that will be used to name the tracer and will prefix the operation name.
   */
  packageName?: string;
  /**
   * The package version used to create a tracer.
   */
  packageVersion?: string;
  /**
   * Attributes to set on the Span
   */
  attributes?: SpanAttributes;

  /** {@link Link}s span to other spans */
  links?: Link[];

  /**
   * The type of Span. Default to SpanKind.INTERNAL
   */
  kind?: SpanKind;

  /**
   * A manually specified start time for the created `Span` object.
   */
  startTime?: TimeInput;
}

/**
 * Creates a reusable function that can create and manage a {@link Span}'s lifecycle
 *
 * @param options - Options that will be used whenever the returned function is invoked.
 * @returns - A function that can be used to add tracing to a given operation.
 */
export function createTrace<TOptions extends { tracingOptions?: OperationTracingOptions }, T>(
  options: Omit<TraceOptions, keyof SpanOptions>
) {
  return (
    spanName: string,
    cb: (updatedOptions: any, span: Span) => Promise<T>,
    operationOptions?: TOptions,
    spanOptions?: SpanOptions
  ) => withTrace(spanName, cb, operationOptions, { ...options, ...spanOptions });
}

/**
 * A function that can wrap an operation with distributed tracing.
 *
 * @param spanName - The name of the {@link Span}, usually in the form of `<ClassName>.<FunctionName>`.
 * @param cb - The callback to invoke with the newly created span.
 * @param operationOptions - The callback's options, which will be updated with the newly created context.
 * @param traceOptions - Additional configuration options.
 * @returns - The callback's return value.
 */
export function withTrace<TOptions extends { tracingOptions?: OperationTracingOptions }, T>(
  spanName: string,
  cb: (updatedOptions: TOptions, span: Span) => Promise<T>,
  operationOptions?: TOptions,
  traceOptions?: TraceOptions
): Promise<T> {
  const tracer = trace.getTracer(
    traceOptions?.packageName || "Azure.Core",
    traceOptions?.packageVersion
  );

  const spanOptions: SpanOptions = traceOptions || {};
  const currentContext = operationOptions?.tracingOptions?.tracingContext || context.active();

  return tracer.startActiveSpan(spanName, spanOptions, currentContext, async (span) => {
    if (traceOptions?.azureNamespace) {
      span.setAttribute(
        knownSpanAttributes.AZ_NAMESPACE.spanAttributeName,
        traceOptions?.azureNamespace
      );
    }

    const newOperationOptions = {
      ...operationOptions,
      tracingOptions: {
        tracingContext: context.active()
      }
    } as TOptions;

    try {
      const result = await cb(newOperationOptions, span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
