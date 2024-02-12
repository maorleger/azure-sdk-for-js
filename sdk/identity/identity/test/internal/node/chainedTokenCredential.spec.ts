// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AccessToken, ChainedTokenCredential, TokenCredential } from "../../../src";
import { describe, expect, it } from "vitest";

import Sinon from "sinon";
import { logger as chainedTokenCredentialLogger } from "../../../src/credentials/chainedTokenCredential";

class TestMockCredential implements TokenCredential {
  constructor(public returnPromise: Promise<AccessToken | null>) {}

  getToken(): Promise<AccessToken | null> {
    return this.returnPromise;
  }
}

describe("ChainedTokenCredential", function () {
  it("Logs the expected successful message", async () => {
    const chainedTokenCredential = new ChainedTokenCredential(
      new TestMockCredential(Promise.resolve({ token: "firstToken", expiresOnTimestamp: 0 })),
    );

    const infoSpy = Sinon.spy(chainedTokenCredentialLogger.parent, "info");
    const getTokenInfoSpy = Sinon.spy(chainedTokenCredentialLogger.getToken, "info");

    const accessToken = await chainedTokenCredential.getToken("<scope>");
    expect(accessToken).to.not.equal(null);

    expect(infoSpy.getCalls()[0].args.join(" ")).to.equal(
      "ChainedTokenCredential => getToken() => Result for TestMockCredential: SUCCESS. Scopes: <scope>.",
    );
    expect(getTokenInfoSpy.getCalls()[0].args[0]).to.equal(
      "Result for TestMockCredential: SUCCESS. Scopes: <scope>.",
    );

    infoSpy.restore();
    getTokenInfoSpy.restore();
  });

  it("Doesn't throw with a clossure credential", async () => {
    function mockCredential(returnPromise: Promise<AccessToken | null>): TokenCredential {
      return {
        getToken: () => returnPromise,
      };
    }

    const chainedTokenCredential = new ChainedTokenCredential(
      mockCredential(Promise.resolve({ token: "firstToken", expiresOnTimestamp: 0 })),
    );

    const infoSpy = Sinon.spy(chainedTokenCredentialLogger.parent, "info");
    const getTokenInfoSpy = Sinon.spy(chainedTokenCredentialLogger.getToken, "info");

    const accessToken = await chainedTokenCredential.getToken("<scope>");
    expect(accessToken).to.not.equal(null);

    expect(infoSpy.getCalls()[0].args.join(" ")).to.equal(
      "ChainedTokenCredential => getToken() => Result for Object: SUCCESS. Scopes: <scope>.",
    );
    expect(getTokenInfoSpy.getCalls()[0].args[0]).to.equal(
      "Result for Object: SUCCESS. Scopes: <scope>.",
    );

    infoSpy.restore();
    getTokenInfoSpy.restore();
  });
});
