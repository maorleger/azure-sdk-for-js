// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Tracer,
  TracerProvider,
  trace,
  context,
  ContextManager,
  Context,
  ROOT_CONTEXT
} from "@opentelemetry/api";
import { TestTracer } from "./testTracer";

export class TestTracerProvider implements TracerProvider {
  private tracerCache: Map<string, TestTracer> = new Map();

  getTracer(name: string, version?: string): Tracer {
    const tracerKey = `${name}${version}`;
    if (!this.tracerCache.has(tracerKey)) {
      this.tracerCache.set(tracerKey, new TestTracer(name, version));
    }
    return this.tracerCache.get(tracerKey)!;
  }

  register(): boolean {
    context.setGlobalContextManager(new TestContextManager());
    return trace.setGlobalTracerProvider(this);
  }

  disable(): void {
    trace.disable();
  }
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
