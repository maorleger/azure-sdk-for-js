// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FullOperationResponse } from "@azure-rest/core-client";
import {
  _fullRestoreOperationDeserialize,
  _fullRestoreOperationSend,
} from "../../generated/api/operations.js";
import {
  FullRestoreOperationOptionalParams,
  RestoreOperation,
  RestoreStatusOptionalParams,
} from "../../generated/index.js";
import {
  KeyVaultAdminPoller,
  KeyVaultAdminPollerOptions,
  KeyVaultAdminPollOperationState,
} from "../keyVaultAdminPoller.js";
import { OperationResponse } from "@azure/core-lro";
import { KeyVaultRestoreResult } from "../../backupClientModels.js";

export interface KeyVaultRestoreOperationState
  extends KeyVaultAdminPollOperationState<KeyVaultRestoreResult> {}

export interface KeyVaultRestorePollerOptions extends KeyVaultAdminPollerOptions {
  folderUri: string;
  sasToken?: string;
  folderName: string;
}

export class KeyVaultRestorePoller extends KeyVaultAdminPoller<
  KeyVaultRestoreOperationState,
  KeyVaultRestoreResult
> {
  protected options: KeyVaultRestorePollerOptions;
  private initialResponseBody?: RestoreOperation;
  constructor(options: KeyVaultRestorePollerOptions) {
    super(options);
    this.options = options;
  }

  /**
   * Tracing the fullRestore operation
   */
  private async fullRestore(
    options?: FullRestoreOperationOptionalParams,
  ): Promise<RestoreOperation> {
    const res = await _fullRestoreOperationSend(
      this.options.client["_client"],
      {
        folderToRestore: this.options.folderName,
        sasTokenParameters: {
          storageResourceUri: this.options.folderUri,
          token: this.options.sasToken,
          useManagedIdentity: this.options.sasToken === undefined,
        },
      },
      options,
    );
    return _fullRestoreOperationDeserialize(res);
  }

  /**
   * Tracing the restoreStatus operation.
   */
  private async restoreStatus(options?: RestoreStatusOptionalParams): Promise<RestoreOperation> {
    if (!this.httpPoller.operationState?.jobId) {
      throw new Error(`Missing "jobId" from the full restore operation.`);
    }
    return this.options.client.restoreStatus(this.httpPoller.operationState.jobId, options);
  }

  async sendInitialRequest(): Promise<OperationResponse<unknown>> {
    let response: FullOperationResponse;
    this.initialResponseBody = await this.fullRestore({
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
      const serviceOperation = await this.restoreStatus(this.options.operationOptions);
      this.mapState(serviceOperation);
    }
  }

  private mapState(serviceOperation: RestoreOperation): void {
    if (this.httpPoller.operationState === undefined) {
      (this.httpPoller as any)["operationState"] = {};
    }
    const state = this.httpPoller.operationState!;
    const { startTime, jobId, endTime, error, statusDetails } = serviceOperation;
    if (!startTime) {
      throw new Error(
        `Missing "startTime" from the full restore operation. Restore did not start successfully.`,
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
        startTime,
        endTime,
      };
    }
  }
}
