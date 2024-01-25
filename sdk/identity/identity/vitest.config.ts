// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    include: ["test/public/node/clientCertificateCredential.spec.ts"],
    fileParallelism: false,
    exclude: ["test/**/browser/*.spec.ts"],
    globals: true,
  },
});
