// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { OperationResponse } from "@azure/core-lro";
import type { KeyVaultBackupResult } from "../../backupClientModels.js";
import type { FullBackupOperation, FullBackupStatusOptionalParams } from "../../generated/index.js";
import type {
  KeyVaultAdminPollerOptions,
  KeyVaultAdminPollOperationState,
} from "../keyVaultAdminPoller.js";
import { KeyVaultAdminPoller } from "../keyVaultAdminPoller.js";
import { _fullBackupDeserialize, _fullBackupSend } from "../../generated/api/operations.js";

/**
 * An interface representing the publicly available properties of the state of a backup Key Vault's poll operation.
 */
export type KeyVaultBackupOperationState = KeyVaultAdminPollOperationState<KeyVaultBackupResult>;

export interface KeyVaultKeyBackupPollerOptions extends KeyVaultAdminPollerOptions {
  /**
   * The URI of the blob storage account.
   */
  blobStorageUri: string;
  /**
   * The SAS token.
   */
  sasToken?: string;
}

export class KeyVaultBackupPoller extends KeyVaultAdminPoller<
  KeyVaultBackupOperationState,
  KeyVaultBackupResult
> {
  protected options: KeyVaultKeyBackupPollerOptions;
  private initialResponseBody?: FullBackupOperation;
  constructor(options: KeyVaultKeyBackupPollerOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Tracing the fullBackupStatus operation
   */
  private fullBackupStatus(options?: FullBackupStatusOptionalParams): Promise<FullBackupOperation> {
    if (!this.httpPoller.operationState?.jobId) {
      throw new Error(`Missing "jobId" from the full backup operation.`);
    }
    return this.options.client.fullBackupStatus(this.httpPoller.operationState.jobId, options);
  }

  async sendInitialRequest(): Promise<OperationResponse<unknown>> {
    const response = await _fullBackupSend(this.options.client["_client"], {
      ...this.options.operationOptions,
      azureStorageBlobContainerUri: {
        storageResourceUri: this.options.blobStorageUri!,
        token: this.options.sasToken,
        useManagedIdentity: this.options.sasToken === undefined,
      },
    });
    this.initialResponseBody = await _fullBackupDeserialize(response);
    return this.getLroResponse(response as any);
  }

  async poll(_options?: {}): Promise<void> {
    await this.httpPoller.submitted();
    // reset the resource location to skip final GET
    // if ((this.httpPoller.operationState as any)?.config) {
    //   (this.httpPoller.operationState as any).config.resourceLocation = undefined;
    // }
    if (!this.httpPoller.operationState?.isStarted && this.initialResponseBody) {
      this.mapState(this.initialResponseBody);
    }
    if (!this.httpPoller.operationState?.isCompleted) {
      const serviceOperation = await this.fullBackupStatus(this.options.operationOptions);
      this.mapState(serviceOperation);
    }
  }

  private mapState(serviceOperation: FullBackupOperation): void {
    if (this.httpPoller.operationState === undefined) {
      (this.httpPoller as any)["operationState"] = {};
    }
    const state = this.httpPoller.operationState!;
    const { startTime, jobId, azureStorageBlobContainerUri, endTime, error, statusDetails } =
      serviceOperation;
    if (!startTime) {
      throw new Error(
        `Missing "startTime" from the full backup operation. Full backup did not start successfully.`,
      );
    }

    state.isStarted = true;
    state.jobId = jobId;
    state.endTime = endTime;
    state.startTime = startTime;
    state.statusDetails = statusDetails;
    state.isCompleted = !!endTime;
    // TODO: transform the status to the one expected by the poller
    state.status = state.isCompleted ? "succeeded" : "running";

    if (state.isCompleted && error?.code) {
      state.status = "failed";
      throw new Error(error?.message || statusDetails);
    }

    if (state.isCompleted) {
      state.result = {
        folderUri: azureStorageBlobContainerUri,
        startTime,
        endTime,
      };
    }
  }
}
