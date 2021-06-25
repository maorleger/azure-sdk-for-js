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
import { supportsTracing } from "../../../keyvault-common/test/utils/supportsTracing";

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

    onVersions({ minVer: "7.3-preview" }).describe("Key Export", () => {
      it.skip("can create an exportable key with release policy and export it", async function(this: Context) {
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
          keyOps: ["wrapKey", "decrypt", "encrypt", "unwrapKey", "sign", "verify"],
          releasePolicy: { data: encodedReleasePolicy }
        });
        console.log(result);

        // TODO: what's important to test here?
        assert.isNotEmpty(JSON.parse(uint8ArrayToString(result.releasePolicy!.data!)));
        assert.isTrue(result.properties.exportable);

        const exportKey = await hsmClient.createRsaKey(`${keyName}-wrap`, { keyOps: ["export"] });
        // TODO: what algorithms are supported?
        // TODO: should wrapping key and algorithm be required?
        // TODO: RestError: export is not supported on this protocol version
        const exportedKey = await hsmClient.exportKey(result.name, result.properties.version!, {
          wrappingKey: exportKey.key,
          algorithm: "CKM_RSA_AES_KEY_WRAP"
        });

        console.log(exportedKey);

        // console.log(exportedKey);

        assert.fail("need to export the key");
        await testClient.flushKey(keyName);
      });

      it("errors when creating a key with exportable but without release policy");
      it("errors when creating a key with release policy but not exportable?");
      it("can import a key with release policy");

      it.only("can create a release-able key and release it", async function() {
        const keyName = recorder.getUniqueName("releasekeytest");
        // const releasePolicyOld = {
        //   anyOf: [
        //     {
        //       allOf: [
        //         {
        //           claim: "sgx-mrsigner",
        //           condition: "equals",
        //           value: "86788fe40448f2a12e20bf8d5e7a1c3139bc5fdc1432b370c1da3489ab649a85"
        //         },
        //         { claim: "sgx-is-debuggable", condition: "equals", value: "true" },
        //         {
        //           claim: "sgx-mrenclave",
        //           condition: "equals",
        //           value: "0000000000000000000000000000000000000000000000000000000000000000"
        //         }
        //       ],
        //       authority: "https://malegeattest.wus.attest.azure.net"
        //     }
        //   ],
        //   version: "1.0"
        // };
        const releasePolicy = {
          anyOf: [
            {
              allOf: [{ claim: "x-ms-sgx-is-debuggable", condition: "equals", value: "true" }],
              authority: "https://malegeattest.wus.attest.azure.net"
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
          "eyJhbGciOiJIUzI1NiJ9.eyJhYXMtZWhkIjoiZXlKclpYbHpJanBiZXlKbElqb2lRVkZCUWlJc0ltdGxlVjl2Y0hNaU9sc2laR1ZqY25sd2RDSXNJbVZ1WTNKNWNIUWlYU3dpYTJsa0lqb2lOVE16TmpReU5HTXRaV1kzWlMxaU1tRm1MVFU1WmprdE5HUXdPRGhtTURRMFpHVTFJaXdpYTNSNUlqb2lVbE5CSWl3aWJpSTZJbkJPYkhoWVNuRTNPSGRPUkVVd2FXMVNOa1JCWWs5alNrRXpUekp1UlZvNVdFaGtjMDVQTjB0b00xWlJRVTh5VWt0eFlqQk9iRXh4TVhwUFRVOTVZVlJPUW5rNWMzUTRjbG95TURWYU1EWTFjalY2YlRKa1FrSllkRkJUU21Sc1VtSm9WRXd0TlRCcWFFVXpiRUV4WjFVemVYcDJaR0o1U1Zob2NtMDNkWEJFVGtKemFXeFNlR1ZVUW1KUGNWOW1XSE5vT1dGMVVHeGxVM0pOWlZCR2JGbElkVmRNTjJacGNYWktiMHMyZUZSSVZFSmZUa2R1WjBWMlFrMTVPRGRxWlVsbExWbEJUbUYxWkRsRk5GYzFhWHBLZFVwNmJGOHhORkJFY1VWdWVGcFNTM0F5YW1WUGJsZEpTRXRVVm0wMWFsRmhiakZoTlVkdmJGWmxRV2szWlhoalNtRXlNaTFLZERSRWEwNHlWakZMTUZCZlR6YzJSME5ETjNCWlVYVlpTWEkxZFZWclExUmtWVVYxYmxKSWIyaFRWbTFHZVZGaldFSlVkVmxuUVdNMVJFZEpaVGQ1UjNSRFdtOW9WRjlsVmxGQ2NESldVU0lzSW5WelpTSTZJbVZ1WXlKOVhYMCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAyMy8iLCJzZ3gtbXJlbmNsYXZlIjoiMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsImlzLWRlYnVnZ2FibGUiOnRydWUsInRlZSI6InNneCIsImlhdCI6MTU4NzQyNTE3MywiZXhwIjoxNjI0NjU5ODgyLCJqdGkiOiJiZTkyYWE4Ni0yMTY1LTRkYWYtODU2My00NGJiODBkODI1NGUifQ.rRcLiNb8uje3tKJi62jvF1hkTapQfqC43IWHcxKIbP8";
        // "dmVyc2lvbj0gMS4wOwoKYXV0aG9yaXphdGlvbnJ1bGVzIHsgCgk9PiBwZXJtaXQoKTsKfTsKCmlzc3VhbmNlcnVsZXMgeyAKCWM6W3R5cGU9PSJ4LW1zLXNneC1pcy1kZWJ1Z2dhYmxlIl0KCT0-IGlzc3VlKHR5cGU9ImlzLWRlYnVnZ2FibGUiLCB2YWx1ZT0idHJ1ZSIpOwoKCWM6W3R5cGU9PSJ4LW1zLXNneC1tcnNpZ25lciJdCgk9PiBpc3N1ZSh0eXBlPSJzZ3gtbXJzaWduZXIiLCB2YWx1ZT0iODY3ODhmZTQwNDQ4ZjJhMTJlMjBiZjhkNWU3YTFjMzEzOWJjNWZkYzE0MzJiMzcwYzFkYTM0ODlhYjY0OWE4NSIpOwoKCWM6W3R5cGU9PSJ4LW1zLXNneC1tcmVuY2xhdmUiXQoJPT4gaXNzdWUodHlwZT0ic2d4LW1yZW5jbGF2ZSIsIHZhbHVlPSIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIik7CgpjOlt0eXBlPT0ieC1tcy1hYXMtZWhkIl0gPT4gaXNzdWUodHlwZT0iYWFzLWVoZCIsIHZhbHVlPSJleUpyWlhseklqcGJleUpsSWpvaVFWRkJRaUlzSW10bGVWOXZjSE1pT2xzaVpHVmpjbmx3ZENJc0ltVnVZM0o1Y0hRaVhTd2lhMmxrSWpvaU5UTXpOalF5TkdNdFpXWTNaUzFpTW1GbUxUVTVaamt0TkdRd09EaG1NRFEwWkdVMUlpd2lhM1I1SWpvaVVsTkJJaXdpYmlJNkluQk9iSGhZU25FM09IZE9SRVV3YVcxU05rUkJZazlqU2tFelR6SnVSVm81V0Voa2MwNVBOMHRvTTFaUlFVOHlVa3R4WWpCT2JFeHhNWHBQVFU5NVlWUk9Rbms1YzNRNGNsb3lNRFZhTURZMWNqVjZiVEprUWtKWWRGQlRTbVJzVW1Kb1ZFd3ROVEJxYUVVemJFRXhaMVV6ZVhwMlpHSjVTVmhvY20wM2RYQkVUa0p6YVd4U2VHVlVRbUpQY1Y5bVdITm9PV0YxVUd4bFUzSk5aVkJHYkZsSWRWZE1OMlpwY1haS2IwczJlRlJJVkVKZlRrZHVaMFYyUWsxNU9EZHFaVWxsTFZsQlRtRjFaRGxGTkZjMWFYcEtkVXA2YkY4eE5GQkVjVVZ1ZUZwU1MzQXlhbVZQYmxkSlNFdFVWbTAxYWxGaGJqRmhOVWR2YkZabFFXazNaWGhqU21FeU1pMUtkRFJFYTA0eVZqRkxNRkJmVHpjMlIwTkROM0JaVVhWWlNYSTFkVlZyUTFSa1ZVVjFibEpJYjJoVFZtMUdlVkZqV0VKVWRWbG5RV00xUkVkSlpUZDVSM1JEV205b1ZGOWxWbEZDY0RKV1VTSXNJblZ6WlNJNkltVnVZeUo5WFgwIik7CgoJYzpbdHlwZT09IngtbXMtYXR0ZXN0YXRpb24tdHlwZSJdCgk9PiBpc3N1ZSh0eXBlPSJ0ZWUiLCB2YWx1ZT1jLnZhbHVlKTsKfTsK";
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
        assert.fail("need to release the key");
      });
    });

    onVersions({ minVer: "7.3-preview" }).describe("getRandomBytes", () => {
      it("supports fetching a random set of bytes", async () => {
        const randomBytes = await hsmClient.getRandomBytes(10);
        assert.equal(randomBytes!.length, 10);
      });

      it("supports tracing", async () => {
        await supportsTracing(
          (tracingOptions) => hsmClient.getRandomBytes(10, { tracingOptions }),
          ["Azure.KeyVault.Keys.KeyClient.getRandomBytes"]
        );
      });
    });
  }
);
