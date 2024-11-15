// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyVaultRestoreResult } from "../../backupClientModels.js";
import { KeyVaultAdminPollOperationState } from "../keyVaultAdminPoller.js";

// import type { RestoreOperation, RestoreOperationParameters } from "../../generated/models/index.js";
// import type { KeyVaultAdminPollOperationState } from "../keyVaultAdminPoller.js";
// import { KeyVaultAdminPollOperation } from "../keyVaultAdminPoller.js";
// import type {
//   KeyVaultBeginRestoreOptions,
//   KeyVaultRestoreResult,
// } from "../../backupClientModels.js";

// import type { AbortSignalLike } from "@azure/abort-controller";
// import type { KeyVaultClient } from "../../generated/keyVaultClient.js";
// import type { OperationOptions } from "@azure-rest/core-client";
// import { tracingClient } from "../../tracing.js";
// import { FullRestoreOperationOptionalParams } from "../../generated/index.js";

// /**
//  * An interface representing the publicly available properties of the state of a restore Key Vault's poll operation.
//  */
export interface KeyVaultRestoreOperationState
  extends KeyVaultAdminPollOperationState<KeyVaultRestoreResult> {}

// /**
//  * An internal interface representing the state of a restore Key Vault's poll operation.
//  * @internal
//  */
// export interface KeyVaultRestorePollOperationState
//   extends KeyVaultAdminPollOperationState<KeyVaultRestoreResult> {
//   /**
//    * The URI of the blob storage account.
//    */
//   folderUri: string;
//   /**
//    * The SAS token.
//    */
//   sasToken?: string;
//   /**
//    * The Folder name of the blob where the previous successful full backup was stored
//    */
//   folderName: string;
// }

// /**
//  * An interface representing a restore Key Vault's poll operation.
//  */
// export class KeyVaultRestorePollOperation extends KeyVaultAdminPollOperation<
//   KeyVaultRestorePollOperationState,
//   KeyVaultRestoreResult
// > {
//   constructor(
//     public state: KeyVaultRestorePollOperationState,
//     private client: KeyVaultClient,
//     private requestOptions: KeyVaultBeginRestoreOptions = {},
//   ) {
//     super(state, {
//       cancelMessage: "Cancelling the restoration full Key Vault backup is not supported.",
//     });
//   }

//   /**
//    * Tracing the fullRestore operation
//    */
//   private fullRestore(
//     restoreBlobDetails: RestoreOperationParameters,
//     options: FullRestoreOperationOptionalParams,
//   ): Promise<RestoreOperation> {
//     return tracingClient.withSpan(
//       "KeyVaultRestorePoller.fullRestore",
//       options,
//       async (updatedOptions) => {
//         const operation = this.client.fullRestoreOperation(restoreBlobDetails, updatedOptions);
//         const jobId = operation.getOperationState().result?.jobId;
//         if (!jobId) {
//           throw new Error(
//             `Missing "jobId" from the full restore operation. ${JSON.stringify(operation)}`,
//           );
//         }
//         const status = await this.client.restoreStatus(jobId, updatedOptions);
//         return status;
//       },
//     );
//   }

//   /**
//    * Tracing the restoreStatus operation.
//    */
//   private async restoreStatus(jobId: string, options: OperationOptions): Promise<RestoreOperation> {
//     return tracingClient.withSpan(
//       "KeyVaultRestorePoller.restoreStatus",
//       options,
//       (updatedOptions) => this.client.restoreStatus(jobId, updatedOptions),
//     );
//   }

//   /**
//    * Reaches to the service and updates the restore poll operation.
//    */
//   async update(
//     options: {
//       abortSignal?: AbortSignalLike;
//       fireProgress?: (state: KeyVaultRestorePollOperationState) => void;
//     } = {},
//   ): Promise<KeyVaultRestorePollOperation> {
//     const state = this.state;
//     const { folderUri, sasToken, folderName } = state;

//     if (options.abortSignal) {
//       this.requestOptions.abortSignal = options.abortSignal;
//     }

//     if (!state.isStarted) {
//       const serviceOperation = await this.fullRestore(
//         {
//           folderToRestore: folderName,
//           sasTokenParameters: {
//             storageResourceUri: folderUri,
//             token: sasToken,
//             useManagedIdentity: sasToken === undefined,
//           },
//         },
//         this.requestOptions,
//       );

//       this.mapState(serviceOperation);
//     } else if (!state.isCompleted) {
//       if (!state.jobId) {
//         throw new Error(`Missing "jobId" from the full restore operation.`);
//       }
//       const serviceOperation = await this.restoreStatus(state.jobId, this.requestOptions);
//       this.mapState(serviceOperation);
//     }

//     return this;
//   }

//   private mapState(serviceOperation: RestoreOperation): void {
//     const state = this.state;
//     const { startTime, jobId, endTime, error, status, statusDetails } = serviceOperation;

//     if (!startTime) {
//       throw new Error(
//         `Missing "startTime" from the full restore operation. Restore did not start successfully.`,
//       );
//     }

//     state.isStarted = true;
//     state.jobId = jobId;
//     state.endTime = endTime;
//     state.startTime = startTime;
//     state.status = status;
//     state.statusDetails = statusDetails;

//     state.isCompleted = !!endTime;

//     if (state.isCompleted && error?.code) {
//       throw new Error(error?.message || statusDetails);
//     }

//     if (state.isCompleted) {
//       state.result = {
//         startTime,
//         endTime,
//       };
//     }
//   }
// }
