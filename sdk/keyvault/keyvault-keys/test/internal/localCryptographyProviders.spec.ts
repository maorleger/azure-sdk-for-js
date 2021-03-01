// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { isNode } from "@azure/core-http";
import { JsonWebKey } from "../../src/keysModels";
import { assert } from "chai";
import {
  AesCryptographyProvider,
  RsaCryptographyProvider
} from "../../src/localCryptography/providers";
import { LocalSupportedAlgorithmName } from "../../src";

describe("local cryptography providers internal tests", () => {
  describe("RsaLocalCryptographyProvider", () => {
    const subject = new RsaCryptographyProvider();
    const supportedOperation = "encrypt";

    describe("isApplicable", () => {
      it("is true for RSA", () => {
        let rsaAlgorithm: LocalSupportedAlgorithmName = "RSA-OAEP";
        assert.isTrue(subject.isApplicable(rsaAlgorithm));
      });

      it("is false for AES", () => {
        let aesAlgorithm: LocalSupportedAlgorithmName = "A192CBCPAD";
        assert.isFalse(subject.isApplicable(aesAlgorithm));
      });
    });

    describe("ensureValid", () => {
      describe("nodeOnly", () => {
        it("throws if we're not in node", async function() {
          if (isNode) {
            this.skip();
          }
          const jsonWebKey: JsonWebKey = {
            keyOps: [supportedOperation],
            kty: "RSA"
          };
          assert.throws(() => subject.ensureValid(supportedOperation, jsonWebKey));
        });
      });

      if (!isNode) {
        // Local cryptography is only supported in NodeJS
        return;
      }

      it("does not throw when conditions are valid", async function() {
        const jsonWebKey: JsonWebKey = {
          keyOps: [supportedOperation],
          kty: "RSA"
        };
        assert.doesNotThrow(() => subject.ensureValid(supportedOperation, jsonWebKey));
      });

      describe("keyOps", () => {
        it("throws if a key doesn't have a specific operation", async function() {
          const jsonWebKey: JsonWebKey = {
            keyOps: [
              /* No supported operation */
            ],
            kty: "RSA"
          };
          assert.throws(() => subject.ensureValid(supportedOperation, jsonWebKey));
        });
      });

      describe("rsa", () => {
        it("throws if a key type is not RSA", async function() {
          const jsonWebKey: JsonWebKey = {
            kty: "EC",
            keyOps: [supportedOperation]
          };
          assert.throws(() => subject.ensureValid(supportedOperation, jsonWebKey));
        });
      });
    });
  });

  describe("AesCryptographyProvider", () => {
    const subject = new AesCryptographyProvider();

    describe("isApplicable", () => {
      it("is false for RSA", () => {
        let rsaAlgorithm: LocalSupportedAlgorithmName = "PS256";
        assert.isFalse(subject.isApplicable(rsaAlgorithm));
      });

      it("is true for AES", () => {
        let aesAlgorithm: LocalSupportedAlgorithmName = "A128CBC";
        assert.isTrue(subject.isApplicable(aesAlgorithm));
      });
    });

    describe("ensureValid", () => {
      const supportedOperation = "encrypt";

      describe("nodeOnly", () => {
        it("throws if we're not in node", async function() {
          if (isNode) {
            this.skip();
          }
          const jsonWebKey: JsonWebKey = {
            keyOps: [supportedOperation],
            kty: "AES"
          };
          assert.throws(() => subject.ensureValid(supportedOperation, jsonWebKey));
        });
      });

      if (!isNode) {
        // Local cryptography is only supported in NodeJS
        return;
      }

      it("does not throw when conditions are valid", async function() {
        const jsonWebKey: JsonWebKey = {
          keyOps: [supportedOperation],
          kty: "AES"
        };
        assert.doesNotThrow(() => subject.ensureValid(supportedOperation, jsonWebKey));
      });

      it("throws if a key doesn't have a specific operation", async function() {
        const jsonWebKey: JsonWebKey = {
          keyOps: [
            /* No supported operation */
          ],
          kty: "AES"
        };
        assert.throws(() => subject.ensureValid(supportedOperation, jsonWebKey));
      });

      it("throws if a key type is not AES", async function() {
        const jsonWebKey: JsonWebKey = {
          kty: "RSA",
          keyOps: [supportedOperation]
        };
        assert.throws(() => subject.ensureValid(supportedOperation, jsonWebKey));
      });
    });
  });
});
