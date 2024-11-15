// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { OperationStatus } from "@azure/core-lro";

// import { AbortSignalLike } from "@azure/abort-controller";
// import type { KeyVaultClient } from "../generated/keyVaultClient.js";
// import type { OperationOptions } from "@azure-rest/core-client";
// import {
//   CancelOnProgress,
//   createHttpPoller,
//   OperationState,
//   OperationStatus,
// } from "@azure/core-lro";

// /**
//  * Common parameters to a Key Vault Admin Poller.
//  */
// export interface KeyVaultAdminPollerOptions {
//   vaultUrl: string;
//   client: KeyVaultClient;
//   requestOptions?: OperationOptions;
//   intervalInMs?: number;
//   resumeFrom?: string;
// }
// /**
//  * PollOperationState contains an opinionated list of the smallest set of properties needed
//  * to define any long running operation poller.
//  *
//  * While the Poller class works as the local control mechanism to start triggering, wait for,
//  * and potentially cancel a long running operation, the PollOperationState documents the status
//  * of the remote long running operation.
//  *
//  * It should be updated at least when the operation starts, when it's finished, and when it's cancelled.
//  * Though, implementations can have any other number of properties that can be updated by other reasons.
//  */
export interface PollOperationState<TResult> {
  /**
   * True if the operation has started.
   */
  isStarted?: boolean;
  /**
   * True if the operation has been completed.
   */
  isCompleted?: boolean;
  /**
   * True if the operation has been cancelled.
   */
  isCancelled?: boolean;
  /**
   * Will exist if the operation encountered any error.
   */
  error?: Error;
  /**
   * Will exist if the operation concluded in a result of an expected type.
   */
  result?: TResult;
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
   * Status of the restore operation.
   */
  status: OperationStatus;
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

// /**
//  * Generates a version of the state with only public properties. At least those common for all of the Key Vault Admin pollers.
//  */
// export function cleanState<TState extends KeyVaultAdminPollOperationState<TResult>, TResult>(
//   state: TState,
// ): KeyVaultAdminPollOperationState<TResult> {
//   return {
//     jobId: state.jobId,
//     status: state.status,
//     statusDetails: state.statusDetails,
//     startTime: state.startTime,
//     endTime: state.endTime,
//     isStarted: state.isStarted,
//     isCancelled: state.isCancelled,
//     isCompleted: state.isCompleted,
//     error: state.error,
//     result: state.result,
//   };
// }
// /**
//  * Abstract representation of a poller, intended to expose just the minimal API that the user needs to work with.
//  */
// export interface PollerLike<TState extends PollOperationState<TResult>, TResult> {
//   /**
//    * Returns a promise that will resolve once a single polling request finishes.
//    * It does this by calling the update method of the Poller's operation.
//    */
//   poll(options?: { abortSignal?: AbortSignalLike }): Promise<void>;
//   /**
//    * Returns a promise that will resolve once the underlying operation is completed.
//    */
//   pollUntilDone(pollOptions?: { abortSignal?: AbortSignalLike }): Promise<TResult>;
//   /**
//    * Invokes the provided callback after each polling is completed,
//    * sending the current state of the poller's operation.
//    *
//    * It returns a method that can be used to stop receiving updates on the given callback function.
//    */
//   onProgress(callback: (state: TState) => void): CancelOnProgress;
//   /**
//    * Returns true if the poller has finished polling.
//    */
//   isDone(): boolean;
//   /**
//    * Stops the poller. After this, no manual or automated requests can be sent.
//    */
//   stopPolling(): void;
//   /**
//    * Returns true if the poller is stopped.
//    */
//   isStopped(): boolean;
//   /**
//    * Attempts to cancel the underlying operation.
//    * @deprecated `cancelOperation` has been deprecated because it was not implemented.
//    */
//   cancelOperation(options?: { abortSignal?: AbortSignalLike }): Promise<void>;
//   /**
//    * Returns the state of the operation.
//    * The TState defined in PollerLike can be a subset of the TState defined in
//    * the Poller implementation.
//    */
//   getOperationState(): TState;
//   /**
//    * Returns the result value of the operation,
//    * regardless of the state of the poller.
//    * It can return undefined or an incomplete form of the final TResult value
//    * depending on the implementation.
//    */
//   getResult(): TResult | undefined;
//   /**
//    * Returns a serialized version of the poller's operation
//    * by invoking the operation's toString method.
//    */
//   toString(): string;
// }
// /**
//  * Common properties and methods of the Key Vault Admin Pollers.
//  */
// // export abstract class KeyVaultAdminPoller<
// //   TState extends KeyVaultAdminPollOperationState<TResult>,
// //   TResult,
// // > implements PollerLike<TState, TResult>
// // {
// //   options: KeyVaultAdminPollerOptions;
// //   httpPoller: PollerLike<OperationState<TResult>, TResult>;
// //   sendInitialRequest: any;
// //   sendPollRequest: any;
// //   constructor(options: KeyVaultAdminPollerOptions) {
// //     this.options = options;
// //     this.httpPoller = createHttpPoller(
// //       {
// //         sendInitialRequest: this.sendInitialRequest.bind(this),
// //         sendPollRequest: this.sendPollRequest.bind(this),
// //       },
// //       options,
// //     );
// //   }
// //   poll(options?: { abortSignal?: AbortSignalLike }): Promise<void> {
// //     throw new Error("Method not implemented.");
// //   }
// //   pollUntilDone(pollOptions?: { abortSignal?: AbortSignalLike }): Promise<TResult> {
// //     throw new Error("Method not implemented.");
// //   }
// //   onProgress(callback: (state: TState) => void): CancelOnProgress {
// //     throw new Error("Method not implemented.");
// //   }
// //   isDone(): boolean {
// //     throw new Error("Method not implemented.");
// //   }
// //   stopPolling(): void {
// //     throw new Error("Method not implemented.");
// //   }
// //   isStopped(): boolean {
// //     throw new Error("Method not implemented.");
// //   }
// //   cancelOperation(options?: { abortSignal?: AbortSignalLike }): Promise<void> {
// //     throw new Error("Method not implemented.");
// //   }
// //   getResult(): TResult | undefined {
// //     throw new Error("Method not implemented.");
// //   }
// //   toString(): string {
// //     throw new Error("Method not implemented.");
// //   }
// //   /**
// //    * Defines how much time the poller is going to wait before making a new request to the service.
// //    */
// //   public intervalInMs: number = 2000;

// //   /**
// //    * The method used by the poller to wait before attempting to update its operation.
// //    */
// //   async delay(): Promise<void> {
// //     return new Promise((resolve) => setTimeout(resolve, this.intervalInMs));
// //   }

// //   /**
// //    * Gets the public state of the polling operation
// //    */
// //   public getOperationState(): TState {
// //     return cleanState(this.getOperationState()) as TState;
// //   }
// // }

// // /**
// //  * Optional parameters to the KeyVaultAdminPollOperation
// //  */
// // export interface KeyVaultAdminPollOperationOptions {
// //   cancelMessage: string;
// // }

// // /**
// //  * Common properties and methods of the Key Vault Admin Poller operations.
// //  */
// // export class KeyVaultAdminPollOperation<
// //   TState extends KeyVaultAdminPollOperationState<unknown>,
// //   TResult,
// // > implements PollOperation<TState, TResult>
// // {
// //   private cancelMessage: string;

// //   constructor(
// //     public state: TState,
// //     options: KeyVaultAdminPollOperationOptions,
// //   ) {
// //     this.cancelMessage = options.cancelMessage;
// //   }

// //   /**
// //    * Meant to reach to the service and update the Poller operation.
// //    */
// //   public async update(): Promise<PollOperation<TState, TResult>> {
// //     throw new Error("Operation not supported.");
// //   }

// //   /**
// //    * Meant to reach to the service and cancel the Poller operation.
// //    */
// //   public async cancel(): Promise<PollOperation<TState, TResult>> {
// //     throw new Error(this.cancelMessage);
// //   }

// //   /**
// //    * Serializes the Poller operation.
// //    */
// //   public toString(): string {
// //     return JSON.stringify({
// //       state: cleanState(this.state),
// //     });
// //   }
// // }
