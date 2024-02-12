// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { AzurePowerShellCredential, CredentialUnavailableError } from "../../../src";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  formatCommand,
  powerShellErrors,
  powerShellPublicErrorMessages,
} from "../../../src/credentials/azurePowerShellCredential";

import Sinon from "sinon";
import { commandStack } from "../../../src/credentials/azurePowerShellCredential";
import { processUtils } from "../../../src/util/processUtils";

function resetCommandStack(): void {
  commandStack[0] = formatCommand("pwsh");
  if (process.platform === "win32") {
    commandStack[1] = formatCommand("powershell");
  } else {
    delete commandStack[1];
  }
}

describe("AzurePowerShellCredential", function () {
  const scope = "https://vault.azure.net/.default";
  const tenantIdErrorMessage =
    "Invalid tenant id provided. You can locate your tenant id by following the instructions listed here: https://learn.microsoft.com/partner-center/find-ids-and-domain-names.";

  let sandbox: Sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = Sinon.createSandbox();
  });

  afterEach(() => {
    resetCommandStack();
    sandbox.restore();
  });

  it("command stack is configured correctly by platform", function () {
    expect(commandStack).toEqual(
      process.platform === "win32" ? ["pwsh.exe", "powershell.exe"] : ["pwsh"],
    );
  });

  it("throws an expected error if the user hasn't logged in through PowerShell", async function () {
    const stub = sandbox.stub(processUtils, "execFile");
    stub.onCall(0).returns(Promise.resolve("")); // The first call checks that the command is available.
    stub.onCall(1).throws(new Error(`Get-AzAccessToken: ${powerShellErrors.login}`));

    const credential = new AzurePowerShellCredential();

    await expect(credential.getToken(scope)).rejects.toThrow(
      new CredentialUnavailableError(powerShellPublicErrorMessages.login),
    );
  });

  it("throws an expected error if the user hasn't installed the Az.Account module", async function () {
    const stub = sandbox.stub(processUtils, "execFile");
    stub.onCall(0).returns(Promise.resolve("")); // The first call checks that the command is available.
    stub.onCall(1).throws(new Error(powerShellErrors.installed));

    const credential = new AzurePowerShellCredential();

    await expect(credential.getToken(scope)).rejects.toThrow(
      new CredentialUnavailableError(powerShellPublicErrorMessages.installed),
    );
  });

  it("throws an expected error if PowerShell isn't installed", async function () {
    const stub = sandbox.stub(processUtils, "execFile");
    stub.onCall(0).throws(new Error());

    // Additionally stub the second call on windows, for the fallback to Windows PowerShell
    if (process.platform === "win32") {
      stub.onCall(1).throws(new Error());
    }

    const credential = new AzurePowerShellCredential();

    await expect(credential.getToken(scope)).rejects.toThrow(
      new CredentialUnavailableError(
        `Error: Unable to execute PowerShell. Ensure that it is installed in your system. To troubleshoot, visit https://aka.ms/azsdk/js/identity/powershellcredential/troubleshoot.`,
      ),
    );
  });

  it("throws an expected error if PowerShell returns something that isn't valid JSON", async function () {
    const stub = sandbox.stub(processUtils, "execFile");
    let idx = 0;
    stub.onCall(idx++).returns(Promise.resolve("")); // The first call checks that the command is available.
    stub.onCall(idx++).returns(Promise.resolve("This one we ignore."));
    stub.onCall(idx++).returns(Promise.resolve("Not valid JSON"));

    const credential = new AzurePowerShellCredential();

    await expect(credential.getToken(scope)).rejects.toThrow(
      new CredentialUnavailableError(
        `Error: Unable to parse the output of PowerShell. Received output: Not valid JSON. To troubleshoot, visit https://aka.ms/azsdk/js/identity/powershellcredential/troubleshoot.`,
      ),
    );
  });

  if (process.platform === "win32") {
    it("throws an expected error if PowerShell returns something that isn't valid JSON (Windows PowerShell fallback)", async function () {
      const stub = sandbox.stub(processUtils, "execFile");
      let idx = 0;
      stub.onCall(idx++).throws(new Error());
      stub.onCall(idx++).returns(Promise.resolve("")); // The first call checks that the command is available.
      stub.onCall(idx++).returns(Promise.resolve("This one we ignore."));
      stub.onCall(idx++).returns(Promise.resolve("Not valid JSON"));

      const credential = new AzurePowerShellCredential();

      await expect(credential.getToken(scope)).rejects.toThrow(
        new CredentialUnavailableError(
          `Error: Unable to parse the output of PowerShell. Received output: Not valid JSON. To troubleshoot, visit https://aka.ms/azsdk/js/identity/powershellcredential/troubleshoot.`,
        ),
      );
    });
  }

  it("authenticates", async function () {
    const tokenResponse = {
      Token: "token",
      ExpiresOn: "2021-04-21T20:52:16+00:00",
      TenantId: "tenant-id",
      Type: "Bearer",
    };

    const stub = sandbox.stub(processUtils, "execFile");
    stub.onCall(0).returns(Promise.resolve("")); // The first call checks that the command is available.
    stub.onCall(1).returns(Promise.resolve("This one we ignore."));
    stub.onCall(2).returns(Promise.resolve(JSON.stringify(tokenResponse)));

    const credential = new AzurePowerShellCredential();

    const token = await credential.getToken(scope);

    expect(token).toEqual({
      token: tokenResponse.Token,
      expiresOnTimestamp: new Date(tokenResponse.ExpiresOn).getTime(),
    });
  });

  it("authenticates with tenantId on getToken", async function () {
    const tokenResponse = {
      Token: "token",
      ExpiresOn: "2021-04-21T20:52:16+00:00",
      TenantId: "tenant-id",
      Type: "Bearer",
    };

    const stub = sandbox.stub(processUtils, "execFile");
    stub.onCall(0).returns(Promise.resolve("")); // The first call checks that the command is available.
    stub.onCall(1).returns(Promise.resolve("This one we ignore."));
    stub.onCall(2).returns(Promise.resolve(JSON.stringify(tokenResponse)));

    const credential = new AzurePowerShellCredential();

    const token = await credential.getToken(scope, { tenantId: "TENANT-ID" });
    expect(token).toEqual({
      token: tokenResponse.Token,
      expiresOnTimestamp: new Date(tokenResponse.ExpiresOn).getTime(),
    });
  });

  /**
   * I'm leaving this test only to make it easier to do manual tests.
   */
  it.skip("authenticates without mocks", async function () {
    const credential = new AzurePowerShellCredential();
    const token = await credential.getToken(scope);
    expect(token.token).toBeDefined();
    expect(token.expiresOnTimestamp).toBeDefined();
  });

  for (const tenantId of [
    "&quot;invalid-tenant-id&quot;",
    " ",
    "12345678-1234-1234-1234-123456789012|",
    "12345678-1234-1234-1234-123456789012 |",
    "<",
    ">",
    "\0",
    "<12345678-1234-1234-1234-123456789012>",
    "12345678-1234-1234-1234-123456789012&",
    "12345678-1234-1234-1234-123456789012;",
    "12345678-1234-1234-1234-123456789012,",
  ]) {
    const testCase =
      tenantId === " " ? "whitespace" : tenantId === "\0" ? "null character" : `"${tenantId}"`;
    it(`rejects invalid tenant id of ${testCase} in getToken`, async function () {
      const credential = new AzurePowerShellCredential();
      await expect(credential.getToken("https://service/.default", { tenantId })).rejects.toThrow(
        tenantIdErrorMessage,
      );
    });
    it(`rejects invalid tenant id of ${testCase} in constructor`, function () {
      expect(() => new AzurePowerShellCredential({ tenantId })).toThrow(tenantIdErrorMessage);
    });
  }

  for (const inputScope of ["scope |", "", "\0", "scope;", "scope,", "scope'", "scope&"]) {
    const testCase =
      inputScope === ""
        ? "empty string"
        : inputScope === "\0"
          ? "null character"
          : `"${inputScope}"`;
    it(`rejects invalid scope of ${testCase}`, async function () {
      const credential = new AzurePowerShellCredential();
      expect(credential.getToken(inputScope)).rejects.toThrow(
        "Invalid scope was specified by the user or calling client",
      );
    });
  }
});
