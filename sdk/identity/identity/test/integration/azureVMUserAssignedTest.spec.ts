// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { isLiveMode } from "@azure-tools/test-recorder";
import { ManagedIdentityCredential } from "../../src/index.js";
import { describe, it, assert, expect, vi, beforeEach, afterEach } from "vitest";

describe("AzureVM UserAssigned Integration test", function () {
  it("test the Azure VM IMDS endpoint where the MI credential is used.", async function (ctx) {
    if (!isLiveMode()) {
      ctx.task.skip();
    }
    const userAssignedVM = process.env.IDENTITY_VM_USER_ASSIGNED_MI_CLIENT_ID;
    if (!userAssignedVM) {
      console.log("IDENTITY_VM_USER_ASSIGNED_MI_CLIENT_ID is not set");
      throw new Error("IDENTITY_VM_USER_ASSIGNED_MI_CLIENT_ID is not set");
    }
    const credential = new ManagedIdentityCredential({ clientId: userAssignedVM });
    const accessToken = await credential.getToken("https://management.azure.com//.default");
    assert.exists(accessToken.token);
  });
});
