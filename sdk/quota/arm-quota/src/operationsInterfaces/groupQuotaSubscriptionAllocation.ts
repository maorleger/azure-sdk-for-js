/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import {
  GroupQuotaSubscriptionAllocationListOptionalParams,
  GroupQuotaSubscriptionAllocationListResponse,
} from "../models/index.js";

/** Interface representing a GroupQuotaSubscriptionAllocation. */
export interface GroupQuotaSubscriptionAllocation {
  /**
   * Gets all the quota allocated to a subscription for the specified resource provider and location for
   * resource names passed in $filter=resourceName eq {SKU}. This will include the GroupQuota and total
   * quota allocated to the subscription. Only the Group quota allocated to the subscription can be
   * allocated back to the MG Group Quota.
   * @param managementGroupId Management Group Id.
   * @param groupQuotaName The GroupQuota name. The name should be unique for the provided context
   *                       tenantId/MgId.
   * @param resourceProviderName The resource provider name, such as - Microsoft.Compute. Currently only
   *                             Microsoft.Compute resource provider supports this API.
   * @param location The name of the Azure region.
   * @param options The options parameters.
   */
  list(
    managementGroupId: string,
    groupQuotaName: string,
    resourceProviderName: string,
    location: string,
    options?: GroupQuotaSubscriptionAllocationListOptionalParams,
  ): Promise<GroupQuotaSubscriptionAllocationListResponse>;
}
