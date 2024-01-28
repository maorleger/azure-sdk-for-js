// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @summary Authenticates with an app registration’s client ID and secret.
 */

import {
  ClientSecretCredential,
  DefaultAzureCredential,
  UsernamePasswordCredential,
} from "@azure/identity";

import { KeyClient } from "@azure/keyvault-keys";

// Load the .env file if it exists
require("dotenv").config();

export async function main(): Promise<void> {
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID!,
    process.env.AZURE_CLIENT_ID!,
    process.env.AZURE_CLIENT_SECRET!,
  );

  const token = await credential.getToken("https://vault.azure.net/.default");
  console.log(token);
}

main().catch((err) => {
  console.log("error code: ", err.code);
  console.log("error message: ", err.message);
  console.log("error stack: ", err.stack);
});
