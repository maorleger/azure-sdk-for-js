// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { assert } from "chai";
import { Context } from "mocha";
import { env, Recorder } from "@azure/test-utils-recorder";

import { KeyClient } from "../../src";
import { authenticate } from "../utils/testAuthentication";
import TestClient from "../utils/testClient";
import { CreateOctKeyOptions } from "../../src/keysModels";
import { getServiceVersion, onVersions } from "../utils/utils.common";
import { stringToUint8Array, uint8ArrayToString } from "../utils/crypto";

onVersions({ minVer: "7.2" }).describe(
  "Keys client - create, read, update and delete operations for managed HSM",
  () => {
    const keyPrefix = `CRUD${env.KEY_NAME || "KeyName"}`;
    let keySuffix: string;
    let hsmClient: KeyClient;
    let testClient: TestClient;
    let recorder: Recorder;

    beforeEach(async function(this: Context) {
      const authentication = await authenticate(this, getServiceVersion());
      recorder = authentication.recorder;

      if (!authentication.hsmClient) {
        // Managed HSM is not deployed for this run due to service resource restrictions so we skip these tests.
        // This is only necessary while Managed HSM is in preview.
        this.skip();
      }

      hsmClient = authentication.hsmClient;
      keySuffix = authentication.keySuffix;
      testClient = new TestClient(authentication.hsmClient);
    });

    afterEach(async function() {
      await recorder.stop();
    });

    it("can create an OCT key with options", async function(this: Context) {
      const keyName = testClient.formatName(`${keyPrefix}-${this!.test!.title}-${keySuffix}`);
      const options: CreateOctKeyOptions = {
        hsm: true
      };
      const result = await hsmClient.createOctKey(keyName, options);
      assert.equal(result.name, keyName, "Unexpected key name in result from createKey().");
      assert.equal(result.keyType, "oct-HSM");
      await testClient.flushKey(keyName);
    });

    onVersions({ minVer: "7.3-preview" }).describe.only("Key Export", () => {
      it("can create an exportable key with release policy and export it", async function(this: Context) {
        const keyName = recorder.getUniqueName("exportkeytest");
        const releasePolicy = {
          anyOf: [
            {
              allOf: [
                {
                  claim: "x-ms-attestation-type",
                  equals: "sevsnpvm"
                },
                {
                  claim: "x-ms-sevsnpvm-authorkeydigest",
                  equals:
                    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
                },
                {
                  claim: "x-ms-runtime.vm-configuration.secure-boot",
                  equals: true
                }
              ],
              authority: "https://sharedeus.eus.test.attest.azure.net/"
            }
          ],
          version: "1.0.0"
        };
        const encodedReleasePolicy = stringToUint8Array(JSON.stringify(releasePolicy));
        // TODO: releasePolicy is a JSON blob, should we convert it in convenience layer?
        // TODO: update swagger with version parameter that is missing
        // TODO: non-exportable keys must not have release policy - guard or nah?
        const result = await hsmClient.createRsaKey(keyName, {
          exportable: true,
          releasePolicy: { data: encodedReleasePolicy }
        });

        // TODO: what's important to test here?
        assert.isNotEmpty(JSON.parse(uint8ArrayToString(result.releasePolicy!.data!)));
        assert.isTrue(result.properties.exportable);

        // const exportKey = await hsmClient.createRsaKey(`${keyName}-wrap`, { keyOps: ["export"] });
        // TODO: what algorithms are supported?
        // TODO: should wrapping key and algorithm be required?
        // TODO: RestError: export is not supported on this protocol version
        // const exportedKey = await hsmClient.exportKey(result.name, result.properties.version!, {
        //   wrappingKey: exportKey.key,
        //   algorithm: "CKM_RSA_AES_KEY_WRAP"
        // });

        // console.log(exportedKey);

        await testClient.flushKey(keyName);
      });

      it("can import a key with release policy");

      it.only("can create a release-able key and release it", async function() {
        const keyName = recorder.getUniqueName("releasekeytest");
        const releasePolicy = {
          anyOf: [
            {
              allOf: [
                {
                  claim: "x-ms-sgx-mrsigner",
                  condition: "equals",
                  value: "86788fe40448f2a12e20bf8d5e7a1c3139bc5fdc1432b370c1da3489ab649a85"
                },
                { claim: "x-ms-sgx-is-debuggable", condition: "equals", value: "false" }
              ],
              authority: "http://localhost:8023/"
            }
          ],
          version: "1.0.0"
        };
        const encodedReleasePolicy = stringToUint8Array(JSON.stringify(releasePolicy));
        // TODO: releasePolicy is a JSON blob, should we convert it in convenience layer?
        // TODO: update swagger with version parameter that is missing
        // TODO: non-exportable keys must not have release policy - guard or nah?
        const result = await hsmClient.createRsaKey(keyName, {
          exportable: true,
          releasePolicy: { data: encodedReleasePolicy }
        });

        // TODO: what's important to test here?
        assert.isNotEmpty(JSON.parse(uint8ArrayToString(result.releasePolicy!.data!)));
        assert.isTrue(result.properties.exportable);

        // TODO: what is attestation?
        const attestation =
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoiMS4wLjAiLCJhdXRob3JpdHkiOiJodHRwOi8vbG9jYWxob3N0OjgwMjMiLCJqdGkiOiJmY2MxOWI2NS1mMDA3LTQ3ZDEtOTMyYS1jMjM4NjM3ZGNiMWEiLCJpYXQiOjE2MjQwNjM1OTAsImV4cCI6MTYyNDA2NzE5MH0.kCvOUD4jJ86WAYi-TVU5HvxNr-iJd1eyHOK8zR1zJnc";
        const releaseResult = await hsmClient.releaseKey(keyName, result.properties.version!, {
          target: attestation
        });
        console.log(releaseResult);

        // const exportKey = await hsmClient.createRsaKey(`${keyName}-wrap`, { keyOps: ["export"] });
        // TODO: what algorithms are supported?
        // TODO: should wrapping key and algorithm be required?
        // TODO: RestError: export is not supported on this protocol version
        // const exportedKey = await hsmClient.exportKey(result.name, result.properties.version!, {
        //   wrappingKey: exportKey.key,
        //   algorithm: "CKM_RSA_AES_KEY_WRAP"
        // });

        // console.log(exportedKey);

        // await testClient.flushKey(keyName);
      });
    });
  }
);
