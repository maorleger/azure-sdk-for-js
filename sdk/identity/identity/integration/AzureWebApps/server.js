// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const express = require("express");
const { ManagedIdentityCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");
const dotenv = require("dotenv");
// Initialize the environment
dotenv.config();
const app = express();

app.get("/", (req, res) => {
  res.send("Ok");
});

app.get("/hello", (req, res) => {
  res.send("Hello!");
});

const port = process.env.PORT || 8080;

console.log("listening on", port);

app.listen(port, () => {
  console.log(`Authorization code redirect server listening on port 8080`);
});
