import { createSpanFunction, OperationTracingOptions } from "@azure/core-tracing";
import chai, { assert, expect } from "chai";
import { chaiAzure } from "../src/chai";
chai.use(chaiAzure);

class TestClass {
  private createSpan: any;
  constructor() {
    this.createSpan = createSpanFunction({
      packagePrefix: "Azure.Test",
      namespace: "Microsoft.Test"
    });
  }

  tracingFunction(tracingOptions: OperationTracingOptions) {
    // console.log("tracingOptions", tracingOptions);
    const { span } = this.createSpan("tracingFunction", { tracingOptions });
    console.log("span", span);
    span.end();
  }
}

describe.only("chai", () => {
  const testClass = new TestClass();

  describe("supportsTracing", () => {
    it("supports assert syntax", async () => {
      await assert.supportsTracing((tracingOptions) => testClass.tracingFunction(tracingOptions), [
        "Azure.Test.tracingFunction"
      ]);
    });

    it("supports expect syntax", async () => {
      await expect((tracingOptions: OperationTracingOptions) =>
        testClass.tracingFunction(tracingOptions)
      ).to.supportTracing(["Azure.Test.tracingFunction"]);
    });
  });
});
