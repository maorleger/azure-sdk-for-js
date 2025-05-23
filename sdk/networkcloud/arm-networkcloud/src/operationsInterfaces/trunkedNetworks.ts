/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import { PagedAsyncIterableIterator } from "@azure/core-paging";
import { SimplePollerLike, OperationState } from "@azure/core-lro";
import {
  TrunkedNetwork,
  TrunkedNetworksListBySubscriptionOptionalParams,
  TrunkedNetworksListByResourceGroupOptionalParams,
  TrunkedNetworksGetOptionalParams,
  TrunkedNetworksGetResponse,
  TrunkedNetworksCreateOrUpdateOptionalParams,
  TrunkedNetworksCreateOrUpdateResponse,
  TrunkedNetworksDeleteOptionalParams,
  TrunkedNetworksDeleteResponse,
  TrunkedNetworksUpdateOptionalParams,
  TrunkedNetworksUpdateResponse,
} from "../models/index.js";

/// <reference lib="esnext.asynciterable" />
/** Interface representing a TrunkedNetworks. */
export interface TrunkedNetworks {
  /**
   * Get a list of trunked networks in the provided subscription.
   * @param options The options parameters.
   */
  listBySubscription(
    options?: TrunkedNetworksListBySubscriptionOptionalParams,
  ): PagedAsyncIterableIterator<TrunkedNetwork>;
  /**
   * Get a list of trunked networks in the provided resource group.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param options The options parameters.
   */
  listByResourceGroup(
    resourceGroupName: string,
    options?: TrunkedNetworksListByResourceGroupOptionalParams,
  ): PagedAsyncIterableIterator<TrunkedNetwork>;
  /**
   * Get properties of the provided trunked network.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param trunkedNetworkName The name of the trunked network.
   * @param options The options parameters.
   */
  get(
    resourceGroupName: string,
    trunkedNetworkName: string,
    options?: TrunkedNetworksGetOptionalParams,
  ): Promise<TrunkedNetworksGetResponse>;
  /**
   * Create a new trunked network or update the properties of the existing trunked network.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param trunkedNetworkName The name of the trunked network.
   * @param trunkedNetworkParameters The request body.
   * @param options The options parameters.
   */
  beginCreateOrUpdate(
    resourceGroupName: string,
    trunkedNetworkName: string,
    trunkedNetworkParameters: TrunkedNetwork,
    options?: TrunkedNetworksCreateOrUpdateOptionalParams,
  ): Promise<
    SimplePollerLike<
      OperationState<TrunkedNetworksCreateOrUpdateResponse>,
      TrunkedNetworksCreateOrUpdateResponse
    >
  >;
  /**
   * Create a new trunked network or update the properties of the existing trunked network.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param trunkedNetworkName The name of the trunked network.
   * @param trunkedNetworkParameters The request body.
   * @param options The options parameters.
   */
  beginCreateOrUpdateAndWait(
    resourceGroupName: string,
    trunkedNetworkName: string,
    trunkedNetworkParameters: TrunkedNetwork,
    options?: TrunkedNetworksCreateOrUpdateOptionalParams,
  ): Promise<TrunkedNetworksCreateOrUpdateResponse>;
  /**
   * Delete the provided trunked network.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param trunkedNetworkName The name of the trunked network.
   * @param options The options parameters.
   */
  beginDelete(
    resourceGroupName: string,
    trunkedNetworkName: string,
    options?: TrunkedNetworksDeleteOptionalParams,
  ): Promise<
    SimplePollerLike<
      OperationState<TrunkedNetworksDeleteResponse>,
      TrunkedNetworksDeleteResponse
    >
  >;
  /**
   * Delete the provided trunked network.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param trunkedNetworkName The name of the trunked network.
   * @param options The options parameters.
   */
  beginDeleteAndWait(
    resourceGroupName: string,
    trunkedNetworkName: string,
    options?: TrunkedNetworksDeleteOptionalParams,
  ): Promise<TrunkedNetworksDeleteResponse>;
  /**
   * Update tags associated with the provided trunked network.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param trunkedNetworkName The name of the trunked network.
   * @param options The options parameters.
   */
  update(
    resourceGroupName: string,
    trunkedNetworkName: string,
    options?: TrunkedNetworksUpdateOptionalParams,
  ): Promise<TrunkedNetworksUpdateResponse>;
}
