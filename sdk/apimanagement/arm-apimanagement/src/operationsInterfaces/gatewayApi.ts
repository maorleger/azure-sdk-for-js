/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import { PagedAsyncIterableIterator } from "@azure/core-paging";
import {
  ApiContract,
  GatewayApiListByServiceOptionalParams,
  GatewayApiGetEntityTagOptionalParams,
  GatewayApiGetEntityTagResponse,
  GatewayApiCreateOrUpdateOptionalParams,
  GatewayApiCreateOrUpdateResponse,
  GatewayApiDeleteOptionalParams,
} from "../models/index.js";

/// <reference lib="esnext.asynciterable" />
/** Interface representing a GatewayApi. */
export interface GatewayApi {
  /**
   * Lists a collection of the APIs associated with a gateway.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param gatewayId Gateway entity identifier. Must be unique in the current API Management service
   *                  instance. Must not have value 'managed'
   * @param options The options parameters.
   */
  listByService(
    resourceGroupName: string,
    serviceName: string,
    gatewayId: string,
    options?: GatewayApiListByServiceOptionalParams,
  ): PagedAsyncIterableIterator<ApiContract>;
  /**
   * Checks that API entity specified by identifier is associated with the Gateway entity.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param gatewayId Gateway entity identifier. Must be unique in the current API Management service
   *                  instance. Must not have value 'managed'
   * @param apiId API identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  getEntityTag(
    resourceGroupName: string,
    serviceName: string,
    gatewayId: string,
    apiId: string,
    options?: GatewayApiGetEntityTagOptionalParams,
  ): Promise<GatewayApiGetEntityTagResponse>;
  /**
   * Adds an API to the specified Gateway.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param gatewayId Gateway entity identifier. Must be unique in the current API Management service
   *                  instance. Must not have value 'managed'
   * @param apiId API identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  createOrUpdate(
    resourceGroupName: string,
    serviceName: string,
    gatewayId: string,
    apiId: string,
    options?: GatewayApiCreateOrUpdateOptionalParams,
  ): Promise<GatewayApiCreateOrUpdateResponse>;
  /**
   * Deletes the specified API from the specified Gateway.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param gatewayId Gateway entity identifier. Must be unique in the current API Management service
   *                  instance. Must not have value 'managed'
   * @param apiId API identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  delete(
    resourceGroupName: string,
    serviceName: string,
    gatewayId: string,
    apiId: string,
    options?: GatewayApiDeleteOptionalParams,
  ): Promise<void>;
}
