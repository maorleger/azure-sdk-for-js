// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @summary Authenticates as an app registration automatically using environment variables.
 */

import { ManagedIdentityCredential } from "@azure/identity";

// Load the .env file if it exists
require("dotenv").config();

export async function main(): Promise<void> {
  // EnvironmentCredential expects the following three environment variables:
  // - AZURE_TENANT_ID: The tenant ID in Microsoft Entra ID
  // - AZURE_CLIENT_ID: The application (client) ID registered in the Microsoft Entra tenant
  // - AZURE_CLIENT_SECRET: The client secret for the registered application
  const credential = new ManagedIdentityCredential();
  console.log(process.env.AZURE_POD_IDENTITY_AUTHORITY_HOST);

  // Retrieving the properties of the existing keys in that specific Key Vault.
  console.log(await credential.getToken("https://vault.azure.net/.default"));
}

main().catch((err) => {
  console.log("error code: ", err.code);
  console.log("error message: ", err.message);
  console.log("error stack: ", err.stack);
});
