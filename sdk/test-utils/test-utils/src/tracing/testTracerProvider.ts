import {
  TracerProvider,
  trace,
  Context,
  context,
  ContextManager,
  ROOT_CONTEXT
} from "@opentelemetry/api";
import { TestTracer } from "./testTracer";

// This must be the same as the default tracer name supplied from @azure/core-tracing.
const TRACER_NAME = "azure/core-tracing";

export class TestTracerProvider implements TracerProvider {
  private tracerCache: Map<string, TestTracer> = new Map();

  getTracer(name: string, _version?: string): TestTracer {
    if (!this.tracerCache.has(name)) {
      this.tracerCache.set(name, new TestTracer(name, name));
    }
    return this.tracerCache.get(name)!;
  }

  register() {
    context.setGlobalContextManager(new TestContextManager());
    trace.setGlobalTracerProvider(this);
  }

  disable() {
    trace.disable();
  }

  setTracer(tracer: TestTracer) {
    this.tracerCache.set(TRACER_NAME, tracer);
  }
}

let tracerProvider: TestTracerProvider;

export function setTracer(tracer?: TestTracer): TestTracer {
  resetTracer();
  tracerProvider = new TestTracerProvider();
  tracerProvider.register();
  if (tracer) {
    tracerProvider.setTracer(tracer);
  }
  return tracerProvider.getTracer(TRACER_NAME);
}

export function resetTracer(): void {
  tracerProvider?.disable();
}

export class TestContextManager implements ContextManager {
  private _currentContext = ROOT_CONTEXT;
  active(): Context {
    return this._currentContext;
  }
  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    const previousContext = this._currentContext;
    this._currentContext = context || ROOT_CONTEXT;

    try {
      return fn.call(thisArg, ...args);
    } finally {
      this._currentContext = previousContext;
    }
  }
  bind<T>(_context: Context, _target: T): T {
    throw new Error("Method not implemented.");
  }
  enable(): this {
    return this;
  }
  disable(): this {
    return this;
  }
}
