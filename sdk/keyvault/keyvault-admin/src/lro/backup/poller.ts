// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { OperationResponse } from "@azure/core-lro";
import { KeyVaultBackupResult } from "../../backupClientModels.js";
import {
  FullBackupOperation,
  FullBackupOptionalParams,
  FullBackupStatusOptionalParams,
} from "../../generated/index.js";
import {
  KeyVaultAdminPollerOptions,
  KeyVaultAdminPoller,
  KeyVaultAdminPollOperationState,
} from "../keyVaultAdminPoller.js";
import { FullOperationResponse } from "@azure-rest/core-client";
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

  // Need to re-write the fullBackup because we want to override the default LRO behavior
  private async fullBackup(option?: FullBackupOptionalParams): Promise<FullBackupOperation> {
    const res = await _fullBackupSend(this.options.client["_client"], {
      ...option,
      azureStorageBlobContainerUri: {
        storageResourceUri: this.options.blobStorageUri!,
        token: this.options.sasToken,
        useManagedIdentity: this.options.sasToken === undefined,
      },
    });
    return _fullBackupDeserialize(res);
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
    let response: FullOperationResponse;
    this.initialResponseBody = await this.fullBackup({
      ...this.options.operationOptions,
      onResponse: (rawResponse) => {
        response = rawResponse;
      },
    });
    return this.getLroResponse(response! as any);
  }

  async poll(_options?: {}): Promise<void> {
    await this.httpPoller.submitted();
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
