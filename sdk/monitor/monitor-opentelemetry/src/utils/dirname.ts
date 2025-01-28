// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { fileURLToPath } from "node:url";
import { dirname as pathDirname } from "node:path";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore ESM only but typescript is not aware
export const dirname = pathDirname(fileURLToPath(import.meta.url));
