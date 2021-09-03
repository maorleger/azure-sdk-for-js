import { trace } from "@opentelemetry/api";
import { OperationTracingOptions, Span, context, SpanOptions, SpanStatusCode } from ".";
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
   * Options that can be used to configure the newly created span.
   */
  spanOptions?: SpanOptions;
}

/**
 * Creates a reusable function that can create and manage a span's lifecycle.
 *
 * @param options - Options that will be used whenever the returned function is invoked.
 * @returns - A function that can be used to add tracing to a given operation.
 */
export function createTrace<TOptions extends { tracingOptions?: OperationTracingOptions }, T>(
  options: Omit<TraceOptions, "spanOptions">
) {
  return (
    operationName: string,
    cb: (updatedOptions: any, span: Span) => Promise<T>,
    operationOptions?: TOptions,
    spanOptions?: SpanOptions | undefined
  ) => withTrace(operationName, cb, operationOptions, { ...options, spanOptions });
}

/**
 * A function that can wrap an operation with distributed tracing.
 * @param operationName - The name of the operation, usually in the form of `<ClassName>.<FunctionName>`.
 * @param cb - The callback to invoke with the newly created span.
 * @param operationOptions - The callback's options, which will be updated with the newly created context.
 * @param options - Additional configuration options.
 * @returns - The callback's return value.
 */
export function withTrace<TOptions extends { tracingOptions?: OperationTracingOptions }, T>(
  operationName: string,
  cb: (updatedOptions: TOptions, span: Span) => Promise<T>,
  operationOptions?: TOptions,
  options?: TraceOptions
): Promise<T> {
  const tracer = trace.getTracer(options?.packageName || "Azure.Core", options?.packageVersion);

  return tracer.startActiveSpan(
    operationName,
    options?.spanOptions || {},
    operationOptions?.tracingOptions?.tracingContext ?? context.active(),
    async (span) => {
      if (options?.azureNamespace) {
        span.setAttribute(
          knownSpanAttributes.AZ_NAMESPACE.spanAttributeName,
          options?.azureNamespace
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
    }
  );
}
