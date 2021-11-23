import chai, { assert } from "chai";
import { chaiAzureTrace } from "./chai";
chai.use(chaiAzureTrace);
import { InMemoryInstrumenter } from "./inMemoryInstrumenter";
import { createTracingClient, TracingClient, useInstrumenter } from "@azure/core-tracing";
// https://github.com/maorleger/azure-sdk-for-js/compare/instrumentation-opentelemetry...maorleger:spike-instrumenter-tests?expand=1

// So like we can have some low-level support with ways to inspect the instrumenter
// check the spans, etc.
describe.only("in-memory", () => {
  const instrumenter = new InMemoryInstrumenter();

  beforeEach(() => {
    useInstrumenter(instrumenter);
  });

  it("works", async () => {
    const instrumenter = new InMemoryInstrumenter();
    const { span, tracingContext } = instrumenter.startSpan("foo");
    console.log(span);
    console.log(tracingContext);

    await instrumenter.withContext(tracingContext, () => {
      assert.equal(instrumenter.currentContext(), tracingContext);
      return Promise.resolve(5);
    });
    span.end();

    assert.equal(instrumenter.startedSpans.length, 1);
    assert.isTrue(instrumenter.startedSpans[0].endCalled);

    assert.notEqual(instrumenter.currentContext(), tracingContext);
  });
});

// We can also offer some high-level "supports tracing" using these InMemoryInstrumenters
// You can see maybe https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/keyvault/keyvault-common/test/utils/supportsTracing.ts for
// inspiration?
// Ideally this is the only test package authors would need to write
describe.only("high-level support", () => {
  it("supports tracing", async () => {
    await assert.supportsTracing(async () => {
      // Right now it has to be initialized here so that the
      // useInstrumenter call is called first
      const client = new FakeClientToTest();
      client.fakeMethod();
    });
  });
});

// Pretend this is a real client with real methods - like QueryLogsClient
// or something that has upgraded to core-tracing preview.14
class FakeClientToTest {
  tracingClient: TracingClient;
  constructor() {
    this.tracingClient = createTracingClient({
      namespace: "Microsoft.Test",
      packageInformation: {
        name: "@azure/test",
        version: "foobar"
      }
    });
  }

  async fakeMethod() {
    return this.tracingClient.withSpan("test", () => {});
  }
}
