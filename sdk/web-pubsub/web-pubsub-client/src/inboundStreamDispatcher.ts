// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { logger } from "./logger.js";
import type {
  GroupStream,
  GroupStreamMessage,
  GroupStreamSubscribeOptions,
  GroupStreamSubscription,
} from "./models/index.js";
import type { GroupDataMessage, StreamDataError, StreamInfo } from "./models/messages.js";

const DEFAULT_IDLE_TIMEOUT_IN_MS = 300000;
const DEFAULT_HANDLE_FROM_START = false;

/**
 * Callback invoked once for every newly observed inbound group stream. The
 * received {@link GroupStream} is async-iterable, so the callback typically runs
 * a `for await` loop over it. Per-stream state is just the callback's closure.
 */
export type GroupStreamCallback = (stream: GroupStream) => void;

/**
 * Concrete {@link GroupStream}. Buffers inbound fragments and exposes them via
 * an async iterator. Terminal state (end / error / idle timeout / disposal) is
 * surfaced both through the iterator and by aborting {@link abortSignal}.
 *
 * This is a prototype implementation: the queue is intentionally simple and
 * unbounded, and back-pressure toward the service is not modeled.
 */
class GroupStreamImpl implements GroupStream {
  public readonly groupName: string;
  public readonly streamId: string;
  public readonly abortSignal: AbortSignal;

  private readonly _abortController = new AbortController();
  private readonly _buffer: GroupStreamMessage[] = [];
  private _waiter?: {
    resolve: (result: IteratorResult<GroupStreamMessage>) => void;
    reject: (reason: unknown) => void;
  };
  private _done = false;
  private _error: unknown;

  constructor(groupName: string, streamId: string) {
    this.groupName = groupName;
    this.streamId = streamId;
    this.abortSignal = this._abortController.signal;
  }

  /** Buffer the next data fragment for consumers. */
  public push(message: GroupStreamMessage): void {
    if (this._done) {
      return;
    }
    if (this._waiter != null) {
      const waiter = this._waiter;
      this._waiter = undefined;
      waiter.resolve({ value: message, done: false });
      return;
    }
    this._buffer.push(message);
  }

  /** Complete the stream successfully once buffered fragments are drained. */
  public end(): void {
    this._finish(undefined);
  }

  /** Terminate the stream with an error (including idle timeout). */
  public fail(error: StreamDataError): void {
    this._finish(error);
  }

  /** Tear the stream down because its owning subscription was disposed. */
  public dispose(): void {
    this._finish(this._error ?? new Error("Group stream subscription was disposed."));
  }

  public [Symbol.asyncIterator](): AsyncIterator<GroupStreamMessage> {
    return {
      next: (): Promise<IteratorResult<GroupStreamMessage>> => this._next(),
      return: (): Promise<IteratorResult<GroupStreamMessage>> => {
        this.dispose();
        return Promise.resolve({ value: undefined, done: true });
      },
    };
  }

  private _next(): Promise<IteratorResult<GroupStreamMessage>> {
    if (this._buffer.length > 0) {
      return Promise.resolve({ value: this._buffer.shift()!, done: false });
    }
    if (this._done) {
      return this._error != null
        ? Promise.reject(this._error)
        : Promise.resolve({ value: undefined, done: true });
    }
    return new Promise((resolve, reject) => {
      this._waiter = { resolve, reject };
    });
  }

  private _finish(error: unknown): void {
    if (this._done) {
      return;
    }
    this._done = true;
    this._error = error;
    this._abortController.abort();

    if (this._waiter != null) {
      const waiter = this._waiter;
      this._waiter = undefined;
      if (error != null) {
        waiter.reject(error);
      } else {
        waiter.resolve({ value: undefined, done: true });
      }
    }
  }
}

/**
 * A single `onGroupStream` subscription. Owns its own options and per-stream
 * tracking state, invokes the callback once per newly observed stream, and
 * feeds fragments into the {@link GroupStreamImpl} it created for that stream.
 */
class GroupStreamSubscriptionImpl implements GroupStreamSubscription {
  private readonly _callback: GroupStreamCallback;
  private readonly _idleTimeoutInMs: number;
  private readonly _handleFromStart: boolean;
  private readonly _groupNames?: ReadonlySet<string>;
  private readonly _onDispose: (subscription: GroupStreamSubscriptionImpl) => void;

  // Active streams keyed by an encoded [groupName, streamId] tuple.
  private readonly _activeStreams = new Map<string, ActiveStream>();
  private readonly _activeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  // Streams skipped by handleFromStart=true, keyed by an encoded [groupName, streamId] tuple.
  private readonly _ignored = new Set<string>();
  private _disposed = false;

  constructor(
    callback: GroupStreamCallback,
    onDispose: (subscription: GroupStreamSubscriptionImpl) => void,
    options?: GroupStreamSubscribeOptions,
  ) {
    this._callback = callback;
    this._onDispose = onDispose;
    this._idleTimeoutInMs = options?.idleTimeoutInMs ?? DEFAULT_IDLE_TIMEOUT_IN_MS;
    this._handleFromStart = options?.handleFromStart ?? DEFAULT_HANDLE_FROM_START;
    this._groupNames = options?.groupNames != null ? new Set(options.groupNames) : undefined;

    if (options?.abortSignal != null) {
      const signal = options.abortSignal;
      if (signal.aborted) {
        this._disposed = true;
      } else {
        signal.addEventListener("abort", () => this.dispose(), { once: true });
      }
    }
  }

  public handleMessage(message: GroupDataMessage, stream: StreamInfo): void {
    if (this._disposed) {
      return;
    }
    if (this._groupNames != null && !this._groupNames.has(message.group)) {
      return;
    }

    const key = this._buildKey(message.group, stream.streamId);

    // For handleFromStart=true, ignore a streamId first seen mid-stream until
    // its terminal frame arrives.
    if (this._ignored.has(key)) {
      if (stream.endOfStream) {
        this._ignored.delete(key);
      }
      return;
    }

    let active = this._activeStreams.get(key);
    if (active == null) {
      if (this._handleFromStart && stream.streamSequenceId !== 1) {
        if (!stream.endOfStream) {
          this._ignored.add(key);
        }
        return;
      }

      const groupStream = new GroupStreamImpl(message.group, stream.streamId);
      active = { key, groupStream };
      this._activeStreams.set(key, active);
      this._invokeCallback(groupStream);
    }

    this._resetActiveTimeout(active);

    const shouldEmitMessage = !stream.endOfStream || this._hasStreamPayload(message);
    if (shouldEmitMessage) {
      active.groupStream.push({
        groupName: message.group,
        fromUserId: message.fromUserId,
        sequenceId: message.sequenceId,
        dataType: message.dataType,
        data: message.data,
      });
    }

    if (stream.endOfStream) {
      if (stream.error != null) {
        active.groupStream.fail(stream.error);
      } else {
        active.groupStream.end();
      }
      this._clearActiveTimeout(key);
      this._activeStreams.delete(key);
    }
  }

  public dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._clear();
    this._onDispose(this);
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }

  private _clear(): void {
    this._activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this._activeTimeouts.clear();
    this._activeStreams.forEach((active) => active.groupStream.dispose());
    this._activeStreams.clear();
    this._ignored.clear();
  }

  private _invokeCallback(groupStream: GroupStream): void {
    try {
      this._callback(groupStream);
    } catch (err) {
      logger.warning("group-stream callback threw.", err);
    }
  }

  private _buildKey(groupName: string, streamId: string): string {
    return JSON.stringify([groupName, streamId]);
  }

  private _resetActiveTimeout(active: ActiveStream): void {
    this._clearActiveTimeout(active.key);
    const timeout = setTimeout(() => {
      const current = this._activeStreams.get(active.key);
      if (current == null || current !== active) {
        return;
      }
      const timeoutError: StreamDataError = {
        name: "IdleTimeout",
        message: "Stream idle timeout: no data received within idleTimeoutInMs.",
      };
      current.groupStream.fail(timeoutError);
      this._activeStreams.delete(active.key);
      this._activeTimeouts.delete(active.key);
    }, this._idleTimeoutInMs);

    this._activeTimeouts.set(active.key, timeout);
  }

  private _clearActiveTimeout(key: string): void {
    const timer = this._activeTimeouts.get(key);
    if (timer != null) {
      clearTimeout(timer);
      this._activeTimeouts.delete(key);
    }
  }

  private _hasStreamPayload(message: GroupDataMessage): boolean {
    if (message.dataType == null) {
      return false;
    }
    if (message.dataType === "json") {
      return message.data !== undefined;
    }
    if (message.data == null) {
      return false;
    }
    if (message.dataType === "text") {
      return typeof message.data === "string" && message.data.length > 0;
    }
    if (message.dataType === "binary" || message.dataType === "protobuf") {
      return message.data instanceof ArrayBuffer && message.data.byteLength > 0;
    }
    return true;
  }
}

/**
 * Tracks `onGroupStream` subscriptions and dispatches each inbound group data
 * message to every live subscription. All per-subscription stream logic lives in
 * {@link GroupStreamSubscriptionImpl}; this class only owns the registry and
 * routing.
 */
export class InboundStreamDispatcher {
  private readonly _subscriptions = new Set<GroupStreamSubscriptionImpl>();

  /**
   * Register a callback with its own per-subscription options. The callback is
   * invoked once per newly observed stream for this subscription only, and the
   * returned handle is used to unsubscribe — the caller never needs to retain
   * the callback reference.
   */
  public subscribe(
    callback: GroupStreamCallback,
    options?: GroupStreamSubscribeOptions,
  ): GroupStreamSubscription {
    const subscription = new GroupStreamSubscriptionImpl(
      callback,
      (s) => this._subscriptions.delete(s),
      options,
    );
    this._subscriptions.add(subscription);
    return subscription;
  }

  /** Dispose every live subscription and drop all in-flight stream state. */
  public clearActiveHandlers(): void {
    for (const subscription of [...this._subscriptions]) {
      subscription.dispose();
    }
  }

  public handleGroupMessage(message: GroupDataMessage): void {
    const stream = message.stream;
    if (stream == null || this._subscriptions.size === 0) {
      return;
    }

    // Snapshot so a callback that subscribes/disposes during dispatch does not
    // disturb iteration over the subscriptions for this message.
    for (const subscription of [...this._subscriptions]) {
      if (this._subscriptions.has(subscription)) {
        subscription.handleMessage(message, stream);
      }
    }
  }
}

interface ActiveStream {
  readonly key: string;
  readonly groupStream: GroupStreamImpl;
}
