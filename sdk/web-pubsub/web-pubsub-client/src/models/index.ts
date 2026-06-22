// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { AbortSignalLike } from "@azure/abort-controller";
import type { WebPubSubClientProtocol } from "../protocols/index.js";
import type {
  DisconnectedMessage,
  GroupDataMessage,
  JSONTypes,
  ServerDataMessage,
  StreamDataError,
  StreamEndError,
  WebPubSubDataType,
} from "./messages.js";

/**
 * The client options
 */
export interface WebPubSubClientOptions {
  /**
   * The subprotocol
   */
  protocol?: WebPubSubClientProtocol;
  /**
   * Whether to auto reconnect after connection is dropped and not recoverable
   */
  autoReconnect?: boolean;
  /**
   * Whether to enable restoring group after reconnecting
   */
  autoRejoinGroups?: boolean;
  /**
   * The retry options for operations like joining group and sending messages
   */
  messageRetryOptions?: WebPubSubRetryOptions;
  /**
   * The retry options for reconnection. Only available when autoReconnect is true.
   */
  reconnectRetryOptions?: WebPubSubRetryOptions;
  /**
   * The idle timeout in milliseconds used to detect half-open connections when no data or pong has
   * been received. Default is 120000ms (120 seconds). Set to 0 to disable this timeout check. Must
   * be greater than or equal to 0. We recommend keeping this value comfortably larger than
   * `keepAliveIntervalInMs` (for example 3x) so that probes have time to run before the timeout
   * closes the socket.
   */
  keepAliveTimeoutInMs?: number;
  /**
   * The interval in milliseconds at which to send keep-alive ping messages to the runtime. Default
   * is 20000ms (20 seconds). Set to 0 to disable client-initiated keep-alive pings. Must be greater
   * than or equal to 0. We recommend choosing a value that is lower than `keepAliveTimeoutInMs`
   * (again, about 3x lower) so the timeout only triggers when multiple pings fail.
   */
  keepAliveIntervalInMs?: number;
}

/**
 * The retry options
 */
export interface WebPubSubRetryOptions {
  /**
   * Number of times the operation needs to be retried in case
   * of retryable error. Default: 3.
   */
  maxRetries?: number;
  /**
   * Amount of time to wait in milliseconds before making the
   * next attempt. Default: `1000 milliseconds`.
   * When `mode` option is set to `Exponential`,
   * this is used to compute the exponentially increasing delays between retries.
   */
  retryDelayInMs?: number;
  /**
   * Denotes the maximum delay between retries
   * that the retry attempts will be capped at. Applicable only when performing exponential retry.
   */
  maxRetryDelayInMs?: number;
  /**
   * Denotes which retry mode to apply. If undefined, defaults to `Fixed`
   */
  mode?: RetryMode;
}

/**
 * Describes the Retry Mode type
 */
export type RetryMode = "Exponential" | "Fixed";

/**
 * The start options
 */
export interface StartOptions {
  /**
   * The abort signal
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Join group operation options
 */
export interface JoinGroupOptions {
  /**
   * The optional ackId. If not specified, client will generate one.
   */
  ackId?: number;
  /**
   * The abort signal
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Leave group operation options
 */
export interface LeaveGroupOptions {
  /**
   * The optional ackId. If not specified, client will generate one.
   */
  ackId?: number;
  /**
   * The abort signal
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Send to group operation options
 */
export interface SendToGroupOptions {
  /**
   * Whether the message should not be echoed back to the sender.
   */
  noEcho?: boolean;
  /**
   * If true, the message won't contains ackId. No AckMessage will be returned from the service.
   */
  fireAndForget?: boolean;
  /**
   * The optional ackId. If not specified, client will generate one.
   */
  ackId?: number;
  /**
   * The abort signal
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Send event operation options
 */
export interface SendEventOptions {
  /**
   * If true, the message won't contains ackId. No AckMessage will be returned from the service.
   */
  fireAndForget?: boolean;
  /**
   * The optional ackId. If not specified, client will generate one.
   */
  ackId?: number;
  /**
   * The abort signal
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Invoke event operation options
 */
export interface InvokeEventOptions {
  /**
   * Optional invocation identifier. If not specified, the client generates one.
   */
  invocationId?: string;
  /**
   * Optional abort signal to cancel the invocation.
   */
  abortSignal?: AbortSignalLike;
}

/**
 * openGroupStream operation options.
 */
export interface OpenGroupStreamOptions {
  /**
   * Optional stream identifier. If not specified, client will generate one.
   */
  streamId?: string;
  /**
   * Whether the stream start message should not be echoed back to the sender.
   * Default: false.
   */
  noEcho?: boolean;
  /**
   * Optional stream idle timeout in milliseconds.
   */
  idleTimeoutInMs?: number;
  /**
   * The abort signal used to cancel opening the stream.
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Group stream write options.
 */
export interface GroupStreamWriteOptions {
  /**
   * Optional abort signal.
   */
  abortSignal?: AbortSignalLike;
}

/**
 * End group stream options.
 */
export interface EndGroupStreamOptions {
  /**
   * Optional abort signal.
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Abort group stream options.
 */
export interface AbortGroupStreamOptions {
  /**
   * Optional abort signal.
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Outbound group stream: a handle for writing one logical stream to a group.
 *
 * Returned by {@link WebPubSubClient.openGroupStream}. This is the *sending*
 * side of streaming. The *receiving* side is the async-iterable
 * {@link GroupStream} surfaced by {@link WebPubSubClient.onGroupStream}.
 */
export interface GroupStreamWriter {
  /**
   * Stream identifier.
   */
  readonly streamId: string;
  /**
   * Write a stream fragment.
   */
  write(
    content: JSONTypes | ArrayBuffer,
    dataType: WebPubSubDataType,
    options?: GroupStreamWriteOptions,
  ): Promise<void>;
  /**
   * End the stream successfully.
   */
  end(options?: EndGroupStreamOptions): Promise<void>;
  /**
   * Abort the stream with an error.
   */
  abort(error: StreamEndError, options?: AbortGroupStreamOptions): Promise<void>;
  /**
   * Register outbound stream error callback.
   * Returns a function to unregister this callback.
   */
  onError(listener: (error: StreamDataError) => void): () => void;
}

/**
 * Parameter of OnConnected callback
 */
export interface OnConnectedArgs {
  /**
   * The connection id
   */
  connectionId: string;
  /**
   * The user id of the client connection
   */
  userId: string;
}

/**
 * Parameter of OnDisconnected callback
 */
export interface OnDisconnectedArgs {
  /**
   * The connection id
   */
  connectionId?: string;
  /**
   * The disconnected message
   */
  message?: DisconnectedMessage;
}

/**
 * Parameter of OnStopped callback
 */
export interface OnStoppedArgs {}

/**
 * Parameter of OnDataMessage callback
 */
export interface OnServerDataMessageArgs {
  /**
   * The data message
   */
  message: ServerDataMessage;
}

/**
 * Parameter of OnGroupDataMessage callback
 */
export interface OnGroupDataMessageArgs {
  /**
   * The group data message
   */
  message: GroupDataMessage;
}

/**
 * Parameter of RejoinGroupFailed callback
 */
export interface OnRejoinGroupFailedArgs {
  /**
   * The group name
   */
  group: string;
  /**
   * The failure error
   */
  error: Error;
}

/**
 * A single inbound fragment of a group stream, yielded while iterating a
 * {@link GroupStream}. Each message corresponds to one data frame of the
 * stream. Iteration completes normally when the sender ends the stream, so a
 * terminal frame is never surfaced as a message.
 */
export interface GroupStreamMessage {
  /**
   * The group this stream belongs to.
   */
  readonly groupName: string;
  /**
   * The user id of the sender.
   */
  readonly fromUserId: string;
  /**
   * Connection-scoped reliable sequence id. Only present on reliable protocols.
   */
  readonly sequenceId?: number;
  /**
   * The payload data type.
   */
  readonly dataType: WebPubSubDataType;
  /**
   * The payload.
   */
  readonly data: JSONTypes | ArrayBuffer;
}

/**
 * Inbound group stream: the *receiving* side of streaming. A `GroupStream` is
 * surfaced once per newly observed inbound stream, either to the callback
 * registered with {@link WebPubSubClient.onGroupStream} or, one specific group
 * at a time, from {@link WebPubSubClient.openGroupStream}.
 *
 * The object is itself async-iterable, so the entire lifecycle of a stream maps
 * onto a single `for await` loop:
 *
 * - each iteration yields the next {@link GroupStreamMessage} fragment in order;
 * - the loop ends normally when the sender ends the stream;
 * - the loop throws if the stream terminates with an error or its idle timeout
 *   elapses.
 *
 * Per-stream state is just the closure scope around the loop — there is no
 * separate handler object to register or retain.
 *
 * @example
 * ```ts
 * using subscription = client.onGroupStream(async (stream) => {
 *   const parts: string[] = [];
 *   try {
 *     for await (const message of stream) {
 *       parts.push(message.data as string); // onData
 *     }
 *     console.log(`stream ${stream.streamId} completed: ${parts.join("")}`); // onEnd
 *   } catch (err) {
 *     console.error(`stream ${stream.streamId} failed`, err); // onError
 *   }
 * });
 * ```
 */
export interface GroupStream extends AsyncIterable<GroupStreamMessage> {
  /**
   * The group this stream belongs to.
   */
  readonly groupName: string;
  /**
   * The stream identifier assigned when the outbound stream was opened.
   */
  readonly streamId: string;
  /**
   * Signals that the stream is no longer active. It aborts when the sender ends
   * the stream, when the stream's idle timeout elapses, or when the owning
   * {@link GroupStreamSubscription} is disposed. Use it to cancel any work tied
   * to the stream's lifetime.
   */
  readonly abortSignal: AbortSignal;
}

/**
 * Options controlling a single {@link WebPubSubClient.onGroupStream}
 * subscription.
 *
 * Granularity is two-level:
 * - The option *values* are scoped to the subscription: each `onGroupStream`
 *   call carries its own values, and different subscriptions may use different
 *   values.
 * - The option *effects* are applied independently to each stream, identified
 *   by its `(groupName, streamId)` pair. Concurrent streams — even two streams
 *   in the same group observed by the same subscription — each get their own
 *   idle timer and their own `handleFromStart` gate.
 */
export interface GroupStreamSubscribeOptions {
  /**
   * Inactivity timeout in milliseconds, applied independently to each stream
   * (identified by its `(groupName, streamId)` pair). Every stream has its own
   * timer that is reset whenever a fragment for that stream arrives. If no
   * fragment arrives within this window, that stream's
   * {@link GroupStream.abortSignal} is aborted and its async iteration throws an
   * `IdleTimeout` error; sibling streams are unaffected.
   * Default: 300000 (5 minutes).
   */
  idleTimeoutInMs?: number;
  /**
   * When true, only streams whose first observed fragment starts the stream
   * (`streamSequenceId === 1`) are surfaced; a stream first observed mid-flight
   * is ignored until its terminal frame arrives. Evaluated independently per
   * stream.
   * Default: false.
   */
  handleFromStart?: boolean;
  /**
   * Restricts the subscription to streams in the given groups. When omitted,
   * streams from every joined group are surfaced.
   */
  groupNames?: string[];
  /**
   * Signal used to tear down the entire subscription. Aborting it is equivalent
   * to calling {@link GroupStreamSubscription.dispose}.
   */
  abortSignal?: AbortSignalLike;
}

/**
 * Handle returned by {@link WebPubSubClient.onGroupStream}. Disposing it stops
 * the callback from receiving new streams and aborts the
 * {@link GroupStream.abortSignal} of every stream the subscription is still
 * tracking, which in turn ends any in-flight `for await` loops.
 *
 * Callers do not need to retain the original callback reference to unsubscribe —
 * they hold this handle instead. It implements {@link Disposable}, so it can be
 * scoped with `using`:
 *
 * @example
 * ```ts
 * using subscription = client.onGroupStream((stream) => {
 *   // ...
 * });
 * // subscription.dispose() is called automatically at end of scope
 * ```
 */
export interface GroupStreamSubscription extends Disposable {
  /**
   * Stop receiving new streams and tear down any in-flight ones.
   */
  dispose(): void;
  /**
   * Same as {@link GroupStreamSubscription.dispose}. Enables `using` scoping.
   */
  [Symbol.dispose](): void;
}

/**
 * The ack result
 */
export interface WebPubSubResult {
  /**
   * The ack message from the service. If the message is fire-and-forget, this will be undefined.
   */
  ackId?: number;
  /**
   * Whether the message is duplicated.
   */
  isDuplicated: boolean;
}

/**
 * Result of invokeEvent
 */
export interface InvokeEventResult {
  /**
   * Invocation identifier correlated with the response.
   */
  invocationId: string;
  /**
   * The response payload data type.
   */
  dataType?: WebPubSubDataType;
  /**
   * The response payload.
   */
  data?: JSONTypes | ArrayBuffer;
}

/**
 * The start options
 */
export interface GetClientAccessUrlOptions {
  /**
   * The abort signal
   */
  abortSignal?: AbortSignalLike;
}

export type * from "./messages.js";
