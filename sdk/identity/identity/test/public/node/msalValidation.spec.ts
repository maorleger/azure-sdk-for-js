// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { setLogLevel } from "@azure/logger";
import { MsalManagedIdentityCredential } from "../../../src/credentials/managedIdentityCredential/msalMsi";
import { ManagedIdentityCredential } from "../../../src/credentials/managedIdentityCredential";

setLogLevel("verbose");
describe.only("msalValidation", function () {
  it("works using the new codepath", async function () {
    const credential = new MsalManagedIdentityCredential();
    try {
      const token = await credential.getToken("https://vault.azure.net/.default");
      console.log(token);
    } catch (e) {
      console.error(e);
    }
  });
  it("works using the existing codepath", async function () {
    const credential = new ManagedIdentityCredential();
    try {
      const token = await credential.getToken("https://vault.azure.net/.default");
      console.log(token);
    } catch (e) {
      console.error(e);
    }
  });
});
