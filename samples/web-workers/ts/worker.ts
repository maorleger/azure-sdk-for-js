import "./polyfill.worker";
import { BlobClient } from "@azure/storage-blob";

const AZURE_BLOB_URI = "";
const blob = new BlobClient(AZURE_BLOB_URI);

blob
  .download()
  .then((resp) => resp.blobBody)
  .then((body) => body.text())
  .then((text) => console.log(text))
  .catch((err) => console.log(err));
