// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// import type { KeyVaultAdminPollOperationState } from "../keyVaultAdminPoller.js";
// import { KeyVaultAdminPollOperation } from "../keyVaultAdminPoller.js";
// import type {
//   KeyVaultBeginSelectiveKeyRestoreOptions,
//   KeyVaultSelectiveKeyRestoreResult,
// } from "../../backupClientModels.js";
// import type {
//   RestoreOperation,
//   SelectiveKeyRestoreOperation,
// } from "../../generated/models/index.js";
// import type { AbortSignalLike } from "@azure/abort-controller";
// import type { KeyVaultClient } from "../../generated/keyVaultClient.js";
// import type { OperationOptions } from "@azure-rest/core-client";
// import { tracingClient } from "../../tracing.js";
// import type { SelectiveKeyRestoreOperationOptionalParams } from "../../generated/index.js";

// /**
//  * The selective restore Key Vault's poll operation.
//  */
// export class KeyVaultSelectiveKeyRestorePollOperation extends KeyVaultAdminPollOperation<
//   KeyVaultSelectiveKeyRestorePollOperationState,
//   string
// > {
//   constructor(
//     public state: KeyVaultSelectiveKeyRestorePollOperationState,
//     private client: KeyVaultClient,
//     private requestOptions: KeyVaultBeginSelectiveKeyRestoreOptions = {},
//   ) {
//     super(state, { cancelMessage: "Cancelling a selective Key Vault restore is not supported." });
//   }

//   /**
//    * Tracing the selectiveRestore operation
//    */
//   private selectiveRestore(
//     keyName: string,
//     options: SelectiveKeyRestoreOperationOptionalParams,
//   ): Promise<SelectiveKeyRestoreOperation> {
//     return tracingClient.withSpan(
//       "KeyVaultSelectiveKeyRestorePoller.selectiveRestore",
//       options,
//       async (updatedOptions) => {
//         const operation = this.client.selectiveKeyRestoreOperation(keyName, updatedOptions);
//         await operation.poll();
//         const jobId = operation.getOperationState().result?.jobId;
//         if (!jobId) {
//           throw new Error(`Missing job ID: ${JSON.stringify(operation.getOperationState())}`);
//         }
//         return this.client.restoreStatus(jobId, updatedOptions);
//       },
//     );
//   }

//   /**
//    * Tracing the restoreStatus operation.
//    */
//   private restoreStatus(
//     jobId: string,
//     options: OperationOptions,
//   ): Promise<SelectiveKeyRestoreOperation> {
//     return tracingClient.withSpan(
//       "KeyVaultSelectiveKeyRestorePoller.restoreStatus",
//       options,
//       (updatedOptions) => this.client.restoreStatus(jobId, updatedOptions),
//     );
//   }

//   /**
//    * Reaches to the service and updates the selective restore poll operation.
//    */
//   async update(
//     options: {
//       abortSignal?: AbortSignalLike;
//       fireProgress?: (state: KeyVaultSelectiveKeyRestorePollOperationState) => void;
//     } = {},
//   ): Promise<KeyVaultSelectiveKeyRestorePollOperation> {
//     const state = this.state;
//     const { keyName, folderUri, sasToken, folderName } = state;

//     if (options.abortSignal) {
//       this.requestOptions.abortSignal = options.abortSignal;
//     }

//     if (!state.isStarted) {
//       const selectiveRestoreOperation = await this.selectiveRestore(keyName, {
//         ...this.requestOptions,
//         restoreBlobDetails: {
//           folder: folderName,
//           sasTokenParameters: {
//             storageResourceUri: folderUri,
//             token: sasToken,
//             useManagedIdentity: sasToken === undefined,
//           },
//         },
//       });
//       this.mapState(selectiveRestoreOperation);
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
//       throw new Error(`Missing "startTime" from the selective restore operation.`);
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
