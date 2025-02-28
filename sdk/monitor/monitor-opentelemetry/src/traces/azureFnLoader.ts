// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { createRequire } from "node:module";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore ESM only
const require = createRequire(import.meta.url);

/**
 * A function to load the Azure Function Core library in an ESM environment.
 */
export function loadAzureFunctionCore(): ReturnType<typeof require> {
  return require("@azure/functions-core");
}
