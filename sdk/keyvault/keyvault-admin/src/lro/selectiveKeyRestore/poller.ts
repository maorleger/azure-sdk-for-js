// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyVaultSelectiveKeyRestoreResult } from "../../backupClientModels.js";
import { KeyVaultAdminPollOperationState } from "../keyVaultAdminPoller.js";

// import type { AbortSignalLike } from "@azure/abort-controller";
// import type { CancelOnProgress } from "@azure/core-lro";
// import type { KeyVaultSelectiveKeyRestoreResult } from "../../backupClientModels.js";
// import type {
//   KeyVaultAdminPollerOptions,
//   KeyVaultAdminPollOperationState,
// } from "../keyVaultAdminPoller.js";
// import type { SimplePollerLike } from "../shim.js";
// /**
//  * An interface representing the publicly available properties of the state of a restore Key Vault's poll operation.
//  */
export interface KeyVaultSelectiveKeyRestoreOperationState
  extends KeyVaultAdminPollOperationState<KeyVaultSelectiveKeyRestoreResult> {}

// // /**
// //  * An internal interface representing the state of a restore Key Vault's poll operation.
// //  */
// // export interface KeyVaultSelectiveKeyRestorePollOperationState
// //   extends KeyVaultAdminPollOperationState<KeyVaultSelectiveKeyRestoreResult> {
// //   /**
// //    * The name of a Key Vault Key.
// //    */
// //   keyName: string;
// //   /**
// //    * The Folder name of the blob where the previous successful full backup was stored
// //    */
// //   folderName: string;
// //   /**
// //    * The URI of the blob storage account where the previous successful full backup was stored.
// //    */
// //   folderUri: string;
// //   /**
// //    * The SAS token.
// //    */
// //   sasToken?: string;
// // }

// // export interface KeyVaultSelectiveKeyRestorePollerOptions extends KeyVaultAdminPollerOptions {
// //   keyName: string;
// //   folderUri: string;
// //   sasToken?: string;
// //   folderName: string;
// // }

// // export class KeyVaultSelectiveKeyRestorePoller
// //   implements
// //     SimplePollerLike<KeyVaultSelectiveKeyRestoreOperationState, KeyVaultSelectiveKeyRestoreResult>
// // {
// //   constructor(options: KeyVaultSelectiveKeyRestorePollerOptions) {
// //     console.log(options);
// //   }
// //   isDone(): boolean {
// //     throw new Error("Method not implemented.");
// //   }
// //   isStopped(): boolean {
// //     throw new Error("Method not implemented.");
// //   }
// //   getOperationState(): KeyVaultSelectiveKeyRestoreOperationState {
// //     throw new Error("Method not implemented.");
// //   }
// //   getResult(): KeyVaultSelectiveKeyRestoreResult | undefined {
// //     throw new Error("Method not implemented.");
// //   }
// //   poll(options?: {
// //     abortSignal?: AbortSignalLike;
// //   }): Promise<KeyVaultSelectiveKeyRestoreOperationState> {
// //     throw new Error("Method not implemented.");
// //   }
// //   pollUntilDone(pollOptions?: {
// //     abortSignal?: AbortSignalLike;
// //   }): Promise<KeyVaultSelectiveKeyRestoreResult> {
// //     throw new Error("Method not implemented.");
// //   }
// //   onProgress(
// //     callback: (state: KeyVaultSelectiveKeyRestoreOperationState) => void,
// //   ): CancelOnProgress {
// //     throw new Error("Method not implemented.");
// //   }
// //   submitted(): Promise<void> {
// //     throw new Error("Method not implemented.");
// //   }
// //   toString(): string {
// //     throw new Error("Method not implemented.");
// //   }
// //   stopPolling(): void {
// //     throw new Error("Method not implemented.");
// //   }
// // }
