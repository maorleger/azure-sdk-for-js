// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { setLogLevel } from "@azure/logger";
import { ManagedIdentityCredential } from "../../../src/credentials/managedIdentityCredential/index";
import { ManagedIdentityCredential as oldImpl } from "../../../src/credentials/managedIdentityCredential/index-old";

describe.only("msal validation", function () {
  setLogLevel("verbose");
  const scope = "https://vault.azure.net/.default";

  it("works using MSAL", async function () {
    const credential = new ManagedIdentityCredential();
    await credential.getToken(scope);
  });

  it("works using our flow", async function () {
    const credential = new oldImpl();
    await credential.getToken(scope);
  });
});
