import { Span } from "@opentelemetry/api";
import { createSpanFunction } from "./createSpan";
import { OperationTracingOptions, SpanStatusCode } from "./interfaces";

/**
 * An interface representing a function that is traced.
 *
 * A traced function will automatically create and close tracing
 * spans as needed and will handle setting the status / errors as a
 * result of calling the underlying callback.
 *
 * use {@link createTraceFunction} to add tracing to a block of code.
 *
 * @internal
 */
export interface TracedFunction {
  <TOptions extends { tracingOptions: OperationTracingOptions }, TReturn>(
    operationName: string,
    options: TOptions,
    cb: (options: TOptions, span: Span) => Promise<TReturn>
  ): Promise<TReturn>;
}

/**
 * Returns a function that can be used for tracing options.
 *
 * @param clientName - The prefix to use, likely the name of the class / client.
 *
 * @example
 *
 * const withTrace = createTraceFunction(
 *   "Microsoft.KeyVault",
 *   "Azure.KeyVault.Certificates.CertificateClient"
 * );
 * class CertificateClient {
 *   getCertificate(options) {
 *     return withTrace("getCertificate", options, (optionsWithTrace) => client.getCertificate(optionsWithTrace));
 *   }
 * }
 * @internal
 */
export function createTrace(namespace: string, clientName: string): TracedFunction {
  const createSpan = createSpanFunction({
    namespace: namespace,
    packagePrefix: clientName
  });

  return async function(operationName, options, cb) {
    const { updatedOptions, span } = createSpan(operationName, options);

    try {
      // NOTE: we really do need to await on this function here so we can handle any exceptions thrown and properly
      // close the span.
      const result = await cb(updatedOptions, span);

      // otel 0.16+ needs this or else the code ends up being set as UNSET
      span.setStatus({
        code: SpanStatusCode.OK
      });
      return result;
    } catch (err) {
      span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message
      });
      throw err;
    } finally {
      span.end();
    }
  };
}
