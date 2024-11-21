// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyVaultSelectiveKeyRestoreResult } from "../../backupClientModels.js";
import { Client, PathUncheckedResponse } from "@azure-rest/core-client";
import { SelectiveKeyRestoreOperationOptionalParams } from "../../generated/index.js";
import { OperationResponse, OperationState, PollerLike } from "@azure/core-lro";
import { getLongRunningPoller } from "../../generated/static-helpers/pollingHelpers.js";
import { _selectiveKeyRestoreOperationSend } from "../../generated/api/operations.js";

export interface KeyVaultSelectiveKeyRestoreOperationState<KeyVaultSelectiveKeyRestoreResult>
  extends OperationState<KeyVaultSelectiveKeyRestoreResult> {
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
  isStarted?: boolean;
  isCompleted?: boolean;
}


function processFinalResult(result: PathUncheckedResponse): Promise<KeyVaultSelectiveKeyRestoreResult> {
  // please note this raw body would be one on the wire
  const serviceOperation = result.body as any;
  const { startTime, endTime, error, statusDetails } = serviceOperation;
  if (serviceOperation.error?.code) {
    throw new Error(error?.message || statusDetails);
  }
  return Promise.resolve({
    startTime: startTime!, // TODO: Please note this startTime would be string on the wire
    endTime,
  });
}

function updateRestoreState(state: KeyVaultSelectiveKeyRestoreOperationState<KeyVaultSelectiveKeyRestoreResult>, response: OperationResponse<unknown>): void {
  // please note this raw body would be one on the wire
  const serviceOperation = (response as OperationResponse<PathUncheckedResponse>).flatResponse.body as any;
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
  state.isCompleted = !!endTime;
  // TODO: transform the status to the one expected by the poller
  state.status = state.isCompleted ? "succeeded" : "running";
  state.statusDetails = statusDetails;
  if (serviceOperation.error?.code) {
    state.status = "failed";
    throw new Error(error?.message || statusDetails);
  }
}


export function selectiveKeyRestoreOperation(
  context: Client,
  keyName: string,
  options: SelectiveKeyRestoreOperationOptionalParams = { requestOptions: {} },
): PollerLike<KeyVaultSelectiveKeyRestoreOperationState<KeyVaultSelectiveKeyRestoreResult>, KeyVaultSelectiveKeyRestoreResult> {
  return getLongRunningPoller(
    context,
    processFinalResult, // TODO: this function to update result
    ["202", "200"],
    {
      updateIntervalInMs: options?.updateIntervalInMs,
      abortSignal: options?.abortSignal,
      getInitialResponse: () =>
        _selectiveKeyRestoreOperationSend(context, keyName, options),
      resourceLocationConfig: "azure-async-operation",
      updateState: updateRestoreState // TODO: this function to update state
    },
  );
}
