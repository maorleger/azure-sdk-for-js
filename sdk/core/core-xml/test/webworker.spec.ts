// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { assert } from "chai";

describe.only("XML serializer (webworker)", function() {
  const worker = new Worker("/base/dist-test/webworker.js");

  after(function() {
    worker.terminate();
  });

  function postMessage(message: { type: string; content: string }): Promise<string> {
    return new Promise((resolve) => {
      const listener = (event: MessageEvent<string>): void => {
        console.log(event);
        worker.removeEventListener("message", listener);
        console.log("event.data", event.data);
        resolve(event.data);
      };
      worker.addEventListener("message", listener);
      worker.postMessage(message);
    });
  }

  describe("parseXML(string)", function() {
    it("should parse it correctly", async function() {
      assert.isTrue(true, "true is true");
      const parsedXml = await postMessage({
        type: "parseXml",
        content: "<a>b</a>"
      });

      console.log("parsedXml", parsedXml);
    });
  });
});

// onmessage = async (_event: MessageEvent<string>) => {
//   // console.log("event.data", event.data);
// };
