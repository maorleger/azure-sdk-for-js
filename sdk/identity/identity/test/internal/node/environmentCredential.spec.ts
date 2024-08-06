// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { getSendCertificateChain } from "../../../src/credentials/environmentCredential.js";
import { describe, it, assert, expect, vi, beforeEach, afterEach } from "vitest";

describe("EnvironmentCredential (internal)", function () {
  afterEach(function () {
    Sinon.restore();
  });

  describe("#getSendCertificateChain", () => {
    it("should parse 'true' correctly", async () => {
      vi.spyOn(process, "env").value({
        AZURE_CLIENT_SEND_CERTIFICATE_CHAIN: "true",
      });

      const sendCertificateChain = getSendCertificateChain();
      assert.isTrue(sendCertificateChain);
    });

    it("should parse '1' correctly", async () => {
      vi.spyOn(process, "env").value({
        AZURE_CLIENT_SEND_CERTIFICATE_CHAIN: "1",
      });

      const sendCertificateChain = getSendCertificateChain();
      assert.isTrue(sendCertificateChain);
    });

    it("is case insensitive", async () => {
      vi.spyOn(process, "env").value({
        AZURE_CLIENT_SEND_CERTIFICATE_CHAIN: "TrUe",
      });

      const sendCertificateChain = getSendCertificateChain();
      assert.isTrue(sendCertificateChain);
    });

    it("should parse undefined correctly", async () => {
      vi.spyOn(process, "env").value({});

      const sendCertificateChain = getSendCertificateChain();
      assert.isFalse(sendCertificateChain);
    });

    it("should default other values to false", async () => {
      vi.spyOn(process, "env").value({
        AZURE_CLIENT_SEND_CERTIFICATE_CHAIN: "foobar",
      });

      const sendCertificateChain = getSendCertificateChain();
      assert.isFalse(sendCertificateChain);
    });
  });
});
