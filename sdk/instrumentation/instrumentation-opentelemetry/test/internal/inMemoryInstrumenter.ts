import {
  Instrumenter,
  InstrumenterSpanOptions,
  SpanStatus,
  TracingContext,
  TracingSpan,
  TracingSpanContext
} from "@azure/core-tracing";

export class InMemoryTracingSpan implements TracingSpan {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  status?: SpanStatus;
  attributes: Record<string, unknown> = {};
  endCalled: boolean = false;
  exception?: string | Error;
  setStatus(status: SpanStatus): void {
    this.status = status;
  }
  setAttribute(name: string, value: unknown): void {
    this.attributes[name] = value;
  }
  end(): void {
    this.endCalled = true;
  }
  recordException(exception: string | Error): void {
    this.exception = exception;
  }
  isRecording(): boolean {
    return true;
  }
  get spanContext() {
    return {
      spanId: "",
      traceFlags: 0,
      traceId: ""
    };
  }
}

export class InMemoryInstrumenter implements Instrumenter {
  public contexts: TracingContext[] = [new ContextImpl()];
  public startedSpans: InMemoryTracingSpan[] = [];

  startSpan(
    name: string,
    spanOptions?: InstrumenterSpanOptions
  ): { span: TracingSpan; tracingContext: TracingContext } {
    const span = new InMemoryTracingSpan(name);
    let context: TracingContext = new ContextImpl(spanOptions?.tracingContext);
    context = context.setValue(Symbol.for("span"), span);
    this.startedSpans.push(span);
    return { span, tracingContext: context };
  }
  withContext<
    CallbackArgs extends unknown[],
    Callback extends (...args: CallbackArgs) => ReturnType<Callback>
  >(
    context: TracingContext,
    callback: Callback,
    callbackThis?: ThisParameterType<Callback>,
    ...callbackArgs: CallbackArgs
  ): ReturnType<Callback> {
    this.contexts.push(context);
    return Promise.resolve(callback.call(callbackThis, ...callbackArgs)).finally(() => {
      this.contexts.pop();
    }) as ReturnType<Callback>;
  }
  parseTraceparentHeader(_traceparentHeader: string): TracingSpanContext | undefined {
    return;
  }
  createRequestHeaders(_spanContext: TracingSpanContext): Record<string, string> {
    return {};
  }
  currentContext() {
    return this.contexts[this.contexts.length - 1];
  }
}

export class ContextImpl implements TracingContext {
  private contextMap: Map<Symbol, unknown>;

  constructor(parentContext?: TracingContext) {
    if (parentContext && !(parentContext instanceof ContextImpl)) {
      throw new Error("received parent context, but it is not mock context...");
    }
    this.contextMap = new Map(parentContext?.contextMap || new Map());
  }

  setValue(key: symbol, value: unknown): TracingContext {
    const newContext = new ContextImpl(this);
    newContext.contextMap.set(key, value);
    return newContext;
  }
  getValue(key: symbol): unknown {
    return this.contextMap.get(key);
  }
  deleteValue(key: symbol): TracingContext {
    const newContext = new ContextImpl(this);
    newContext.contextMap.delete(key);
    return newContext;
  }
}
