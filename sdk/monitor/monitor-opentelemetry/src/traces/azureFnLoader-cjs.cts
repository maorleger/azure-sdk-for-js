// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A CommonJS module loader for Azure Function Core.
 */
export function loadAzureFunctionCore(): ReturnType<typeof require> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@azure/functions-core");
}
