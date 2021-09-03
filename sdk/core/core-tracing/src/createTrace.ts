import { context, SpanKind, SpanOptions, SpanStatusCode, trace } from "@opentelemetry/api";
import { OperationTracingOptions, Context, Span, setSpan } from ".";
import { knownSpanAttributes } from "./createSpan";

export function createTrace<
  TOptions extends { tracingOptions?: OperationTracingOptions },
  T
>(options?: { namespace?: string; packageName?: string; packageVersion?: string }) {
  return function(
    operationName: string,
    cb: (updatedOptions: any, span: Span) => Promise<T>,
    operationOptions?: TOptions,
    spanOptions?: SpanOptions | undefined
  ) {
    const allOptions = { ...options, spanOptions };
    return withTrace(operationName, cb, operationOptions, allOptions);
  };
}

export function withTrace<TOptions extends { tracingOptions?: OperationTracingOptions }, T>(
  operationName: string,
  cb: (updatedOptions: TOptions, span: Span) => Promise<T>,
  operationOptions?: TOptions,
  options?: {
    namespace?: string;
    packageName?: string;
    packageVersion?: string;
    spanOptions?: SpanOptions;
  }
): Promise<T> {
  const tracer = trace.getTracer(options?.packageName || "Azure.Core", options?.packageVersion);

  const spanName = [options?.packageName, operationName].join(".");
  return tracer.startActiveSpan(
    spanName,
    options?.spanOptions || {},
    operationOptions?.tracingOptions?.tracingContext ?? context.active(),
    async (span) => {
      if (options?.namespace) {
        span.setAttribute(knownSpanAttributes.AZ_NAMESPACE.spanAttributeName, options?.namespace);
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
        throw err;
      } finally {
        span.end();
      }
    }
  );
}

const wt = createTrace({ namespace: "", packageName: "", packageVersion: "" });
wt(
  "f",
  (updatedOptions, span) => {
    return Promise.resolve(5);
  },
  {},
  { kind: SpanKind.CLIENT }
);
const f = withTrace(
  "foo",
  (updatedOptions, span) => {
    return Promise.resolve(5);
  },
  {},
  {}
);
