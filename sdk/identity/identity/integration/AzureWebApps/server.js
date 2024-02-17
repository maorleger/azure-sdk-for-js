// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const express = require("express");
const { ManagedIdentityCredential } = require("@azure/identity");
const { BlobServiceClient } = require("@azure/storage-blob");

const app = express();

app.get("/", (req, res) => {
  res.send("Ok");
});

app.get("/hello", (req, res) => {
  const credential = new ManagedIdentityCredential();
  console.log(credential);
  res.send(JSON.stringify(credential));
});

const port = process.env.PORT || 8080;

console.log("listening on", port);

app.listen(port, () => {
  console.log(`Authorization code redirect server listening on port 8080`);
});
