// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HttpResponse, OperationOptions } from "@azure-rest/core-client";
import { AbortSignalLike } from "@azure/abort-controller";
import {
  CancelOnProgress,
  OperationResponse,
  OperationState,
  createHttpPoller,
  PollerLike as CorePollerLike,
} from "@azure/core-lro";
import { KeyVaultClient } from "../generated/keyVaultClient.js";

export interface PollOperationState<TResult> extends OperationState<TResult> {
  /**
   * True if the operation has started.
   */
  isStarted?: boolean;
  isCompleted?: boolean;
}

/**
 * An interface representing the state of a Key Vault Admin Poller's operation.
 */
export interface KeyVaultAdminPollOperationState<TResult> extends PollOperationState<TResult> {
  /**
   * Identifier for the full restore operation.
   */
  jobId?: string;
  /**
   * The status details of restore operation.
   */
  statusDetails?: string;
  /**
   * The start time of the restore operation in UTC
   */
  startTime?: Date;
  /**
   * The end time of the restore operation in UTC
   */
  endTime?: Date;
}

/**
 * Abstract representation of a poller, intended to expose just the minimal API that the user needs to work with.
 */
export interface PollerLike<TState extends PollOperationState<TResult>, TResult> {
  /**
   * Returns a promise that will resolve once a single polling request finishes.
   * It does this by calling the update method of the Poller's operation.
   */
  poll(options?: { abortSignal?: AbortSignalLike }): Promise<void>;
  /**
   * Returns a promise that will resolve once the underlying operation is completed.
   */
  pollUntilDone(pollOptions?: { abortSignal?: AbortSignalLike }): Promise<TResult>;
  /**
   * Returns the state of the operation.
   * The TState defined in PollerLike can be a subset of the TState defined in
   * the Poller implementation.
   */
  getOperationState(): TState;
  /**
   * Returns the result value of the operation,
   * regardless of the state of the poller.
   * It can return undefined or an incomplete form of the final TResult value
   * depending on the implementation.
   */
  getResult(): TResult | undefined;
  /**
   * Returns a serialized version of the poller's operation
   * by invoking the operation's toString method.
   */
  toString(): string;
}

/**
 * Common parameters to a Key Vault Key Poller.
 */
export interface KeyVaultAdminPollerOptions {
  client: KeyVaultClient;
  operationOptions?: OperationOptions;
  intervalInMs?: number;
  resumeFrom?: string;
}
export class KeyVaultAdminPoller<TState extends KeyVaultAdminPollOperationState<TResult>, TResult>
  implements PollerLike<TState, TResult>
{
  protected httpPoller: CorePollerLike<TState, TResult>;
  protected options: KeyVaultAdminPollerOptions;
  constructor(options: KeyVaultAdminPollerOptions) {
    this.options = options;
    this.httpPoller = createHttpPoller(
      {
        sendInitialRequest: this.sendInitialRequest.bind(this),
        sendPollRequest: (_path: string) => {
          throw new Error("No need to pass poll request.");
        },
      },
      {
        restoreFrom: options.resumeFrom,
      },
    );
    // we need to bind the poll function to the current instance so we could override any polling behavior
    this.httpPoller.poll = this.poll.bind(this);
  }
  getOperationState(): TState {
    if (!this.httpPoller.operationState) {
      throw new Error("Operation state is not available.");
    }
    return this.httpPoller.operationState;
  }

  async sendInitialRequest(): Promise<OperationResponse<unknown>> {
    throw new Error("Method not implemented.");
  }

  async poll(_options?: { abortSignal?: AbortSignalLike }): Promise<any> {
    return this.httpPoller.poll();
  }
  pollUntilDone(pollOptions?: { abortSignal?: AbortSignalLike }): Promise<any> {
    return this.httpPoller.pollUntilDone(pollOptions);
  }
  onProgress(callback: (state: any) => void): CancelOnProgress {
    return this.httpPoller.onProgress(callback);
  }
  stopPolling(): void {
    throw new Error("Method not implemented.");
  }
  isStopped(): boolean {
    throw new Error("Method not implemented.");
  }
  cancelOperation(_options?: { abortSignal?: AbortSignalLike }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getResult(): any {
    return this.httpPoller.result;
  }
  toString(): string {
    if (!this.httpPoller.operationState) {
      throw new Error(
        "Operation state is not available. The poller may not have been started and you could await submitted() before calling getOperationState().",
      );
    }
    return JSON.stringify({
      state: this.httpPoller.operationState,
    });
  }
  isDone(): boolean {
    return this.httpPoller.isDone;
  }
  submitted(): Promise<void> {
    return this.httpPoller.submitted();
  }

  getLroResponse(raw: HttpResponse): OperationResponse<HttpResponse> {
    return {
      flatResponse: raw,
      rawResponse: {
        ...raw,
        statusCode: Number(raw.status),
        body: raw.body,
      },
    };
  }
}
