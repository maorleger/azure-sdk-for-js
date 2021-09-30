import { ContextManager, ROOT_CONTEXT, Context } from "@opentelemetry/api";
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
