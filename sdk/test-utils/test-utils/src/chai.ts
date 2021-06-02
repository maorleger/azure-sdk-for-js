import {
  OperationTracingOptions,
  setSpan,
  setTracer,
  TestTracer,
  TestSpan,
  context
} from "@azure/core-tracing";
import { assert } from "chai";

export type SupportsTracingOptions = {
  rootSpansPrefix?: string;
};

const rootSpanName = "supportsTracingRootSpan";

async function supportsTracing(
  callback: (tracingOptions: OperationTracingOptions) => unknown,
  children: string[],
  options: SupportsTracingOptions = {}
) {
  const tracer = new TestTracer();
  setTracer(tracer);
  const rootSpan = tracer.startSpan(rootSpanName);
  const tracingContext = setSpan(context.active(), rootSpan);

  try {
    await callback({ tracingContext });
  } finally {
    rootSpan.end();
  }

  let rootSpans = tracer.getRootSpans();

  if (options.rootSpansPrefix) {
    rootSpans = rootSpans.filter(
      (span) => span.name.startsWith(options.rootSpansPrefix!) || span.name === rootSpanName
    );
  }
  assert.equal(rootSpans.length, 1, `Found unparented spans ${formatSpans(rootSpans)}`);
  assert.strictEqual(rootSpan, rootSpans[0], "The root span should match what was passed in.");

  // Ensure top-level children are created correctly.
  // Testing the entire tree structure can be tricky as other packages might create their own spans.
  const spanGraph = tracer.getSpanGraph(rootSpan.context().traceId);
  const directChildren = spanGraph.roots[0].children.map((child) => child.name);

  // LROs might poll N times, so we'll make a unique array and compare that.
  assert.sameMembers(Array.from(new Set(directChildren)), children);

  // Ensure all spans are properly closed
  assert.equal(
    tracer.getActiveSpans().length,
    0,
    `Found unclosed spans ${formatSpans(tracer.getActiveSpans())}`
  );
}

function formatSpans(spans: TestSpan[]) {
  const spanNames = spans
    .filter((s) => s.name !== rootSpanName)
    .map((s) => s.name)
    .join(", ");
  return `[${spanNames}]`;
}

declare global {
  export namespace Chai {
    interface Assertion {
      supportTracing(children: string[], options?: SupportsTracingOptions): Promise<void>;
    }

    interface AssertStatic {
      supportsTracing(
        callback: (tracingOptions: OperationTracingOptions) => unknown,
        children: string[],
        options?: SupportsTracingOptions
      ): Promise<void>;
    }
  }
}

export function chaiAzure(chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
  utils.addMethod(chai.Assertion.prototype, "supportTracing", function(
    this: any,
    children: string[]
  ) {
    return assert.supportsTracing(utils.flag(this, "object"), children);
  });
  utils.addMethod(chai.assert, "supportsTracing", supportsTracing);
}
