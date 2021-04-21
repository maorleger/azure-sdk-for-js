// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { OperationOptions } from "@azure/core-http";
import { createSpanFunction, Span, SpanStatusCode } from "@azure/core-tracing";

/**
 * An interface representing a function that is traced.
 *
 * A traced function will automatically create and close tracing '
 * spans as needed and will handle setting the status / errors as a
 * result of calling the underlying callback.
 *
 * use {@link createTraceFunction} to add tracing to a block of code.
 *
 * @internal
 */
export interface TracedFunction {
  <TOptions extends OperationOptions, TReturn>(
    operationName: string,
    options: TOptions,
    cb: (options: TOptions, span: Span) => Promise<TReturn>
  ): Promise<TReturn>;
}

/**
 * Returns a function that can be used for tracing options.
 *
 * @param prefix - The prefix to use, likely the name of the class / client.
 *
 * @example const withTrace = createTraceFunction("Azure.KeyVault.Certificates.CertificateClient")
 *
 * @internal
 */
export function createTraceFunction(prefix: string): TracedFunction {
  const createSpan = createSpanFunction({
    namespace: "Microsoft.KeyVault",
    packagePrefix: prefix
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

export function instrument<T extends { constructor: any; prototype: any; name: string }>(
  obj: T,
  methods: Array<keyof T["prototype"]>,
  prefix: string = ""
): void {
  const proto = obj.prototype;

  for (const method of methods) {
    if (typeof proto[method] === "function" && !proto[`__${method}`]) {
      Object.defineProperty(proto, `__${method}`, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: proto[method]
      });
      Object.defineProperty(proto, method, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: instrumentFn(obj, proto[method], createTraceFunction(`${prefix}.${method}`))
      });
    }
  }
}

export function instrumentFn<T extends (...args: any[]) => Promise<ReturnType<T>>>(
  obj: any,
  func: T,
  withTrace: TracedFunction
): (...funcArgs: Parameters<T>) => Promise<ReturnType<T>> {
  function isOperationOptions(arg: any): arg is OperationOptions {
    if (
      typeof arg === "object" &&
      ("abortSignal" in arg || "requestOptions" in arg || "tracingOptions" in arg)
    ) {
      return true;
    }
    return false;
  }

  const spliceOptions = (args: Parameters<T>[]) => {
    const rest = [];
    let options: OperationOptions = {};

    for (let arg of args) {
      if (isOperationOptions(arg)) {
        options = arg;
      } else {
        rest.push(arg);
      }
    }

    return { options, rest };
  };

  return function wrapped(...args: Parameters<T>): Promise<ReturnType<T>> {
    const { options, rest } = spliceOptions(args);
    return withTrace(func.name, options, (updatedOptions) =>
      func.apply(obj, [...rest, updatedOptions])
    );
  };
}
