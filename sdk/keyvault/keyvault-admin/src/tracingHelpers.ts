// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { OperationOptions } from "@azure/core-client";

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
    cb: (options: TOptions, span: any) => Promise<TReturn>
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
export function createTraceFunction(_prefix: string): TracedFunction {
  // const createSpan = createSpanFunction({
  //   namespace: "Microsoft.KeyVault",
  //   packagePrefix: prefix
  // });

  return async function(_operationName, options, cb) {
    return cb(options, undefined);
  };
}
