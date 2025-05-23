/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import { PagedAsyncIterableIterator, PageSettings } from "@azure/core-paging";
import { setContinuationToken } from "../pagingHelper.js";
import { WorkspaceGroupUser } from "../operationsInterfaces/index.js";
import * as coreClient from "@azure/core-client";
import * as Mappers from "../models/mappers.js";
import * as Parameters from "../models/parameters.js";
import { ApiManagementClient } from "../apiManagementClient.js";
import {
  UserContract,
  WorkspaceGroupUserListNextOptionalParams,
  WorkspaceGroupUserListOptionalParams,
  WorkspaceGroupUserListResponse,
  WorkspaceGroupUserCheckEntityExistsOptionalParams,
  WorkspaceGroupUserCheckEntityExistsResponse,
  WorkspaceGroupUserCreateOptionalParams,
  WorkspaceGroupUserCreateResponse,
  WorkspaceGroupUserDeleteOptionalParams,
  WorkspaceGroupUserListNextResponse,
} from "../models/index.js";

/// <reference lib="esnext.asynciterable" />
/** Class containing WorkspaceGroupUser operations. */
export class WorkspaceGroupUserImpl implements WorkspaceGroupUser {
  private readonly client: ApiManagementClient;

  /**
   * Initialize a new instance of the class WorkspaceGroupUser class.
   * @param client Reference to the service client
   */
  constructor(client: ApiManagementClient) {
    this.client = client;
  }

  /**
   * Lists a collection of user entities associated with the group.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param groupId Group identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  public list(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    options?: WorkspaceGroupUserListOptionalParams,
  ): PagedAsyncIterableIterator<UserContract> {
    const iter = this.listPagingAll(
      resourceGroupName,
      serviceName,
      workspaceId,
      groupId,
      options,
    );
    return {
      next() {
        return iter.next();
      },
      [Symbol.asyncIterator]() {
        return this;
      },
      byPage: (settings?: PageSettings) => {
        if (settings?.maxPageSize) {
          throw new Error("maxPageSize is not supported by this operation.");
        }
        return this.listPagingPage(
          resourceGroupName,
          serviceName,
          workspaceId,
          groupId,
          options,
          settings,
        );
      },
    };
  }

  private async *listPagingPage(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    options?: WorkspaceGroupUserListOptionalParams,
    settings?: PageSettings,
  ): AsyncIterableIterator<UserContract[]> {
    let result: WorkspaceGroupUserListResponse;
    let continuationToken = settings?.continuationToken;
    if (!continuationToken) {
      result = await this._list(
        resourceGroupName,
        serviceName,
        workspaceId,
        groupId,
        options,
      );
      let page = result.value || [];
      continuationToken = result.nextLink;
      setContinuationToken(page, continuationToken);
      yield page;
    }
    while (continuationToken) {
      result = await this._listNext(
        resourceGroupName,
        serviceName,
        workspaceId,
        groupId,
        continuationToken,
        options,
      );
      continuationToken = result.nextLink;
      let page = result.value || [];
      setContinuationToken(page, continuationToken);
      yield page;
    }
  }

  private async *listPagingAll(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    options?: WorkspaceGroupUserListOptionalParams,
  ): AsyncIterableIterator<UserContract> {
    for await (const page of this.listPagingPage(
      resourceGroupName,
      serviceName,
      workspaceId,
      groupId,
      options,
    )) {
      yield* page;
    }
  }

  /**
   * Lists a collection of user entities associated with the group.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param groupId Group identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  private _list(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    options?: WorkspaceGroupUserListOptionalParams,
  ): Promise<WorkspaceGroupUserListResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, groupId, options },
      listOperationSpec,
    );
  }

  /**
   * Checks that user entity specified by identifier is associated with the group entity.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param groupId Group identifier. Must be unique in the current API Management service instance.
   * @param userId User identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  checkEntityExists(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    userId: string,
    options?: WorkspaceGroupUserCheckEntityExistsOptionalParams,
  ): Promise<WorkspaceGroupUserCheckEntityExistsResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, groupId, userId, options },
      checkEntityExistsOperationSpec,
    );
  }

  /**
   * Add existing user to existing group
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param groupId Group identifier. Must be unique in the current API Management service instance.
   * @param userId User identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  create(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    userId: string,
    options?: WorkspaceGroupUserCreateOptionalParams,
  ): Promise<WorkspaceGroupUserCreateResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, groupId, userId, options },
      createOperationSpec,
    );
  }

  /**
   * Remove existing user from existing group.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param groupId Group identifier. Must be unique in the current API Management service instance.
   * @param userId User identifier. Must be unique in the current API Management service instance.
   * @param options The options parameters.
   */
  delete(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    userId: string,
    options?: WorkspaceGroupUserDeleteOptionalParams,
  ): Promise<void> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, groupId, userId, options },
      deleteOperationSpec,
    );
  }

  /**
   * ListNext
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param groupId Group identifier. Must be unique in the current API Management service instance.
   * @param nextLink The nextLink from the previous successful call to the List method.
   * @param options The options parameters.
   */
  private _listNext(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    groupId: string,
    nextLink: string,
    options?: WorkspaceGroupUserListNextOptionalParams,
  ): Promise<WorkspaceGroupUserListNextResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        serviceName,
        workspaceId,
        groupId,
        nextLink,
        options,
      },
      listNextOperationSpec,
    );
  }
}
// Operation Specifications
const serializer = coreClient.createSerializer(Mappers, /* isXml */ false);

const listOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/groups/{groupId}/users",
  httpMethod: "GET",
  responses: {
    200: {
      bodyMapper: Mappers.UserCollection,
    },
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  queryParameters: [
    Parameters.apiVersion,
    Parameters.filter,
    Parameters.top,
    Parameters.skip,
  ],
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.serviceName,
    Parameters.groupId,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const checkEntityExistsOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/groups/{groupId}/users/{userId}",
  httpMethod: "HEAD",
  responses: {
    204: {},
    404: {},
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  queryParameters: [Parameters.apiVersion],
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.serviceName,
    Parameters.groupId,
    Parameters.userId,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const createOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/groups/{groupId}/users/{userId}",
  httpMethod: "PUT",
  responses: {
    200: {
      bodyMapper: Mappers.UserContract,
    },
    201: {
      bodyMapper: Mappers.UserContract,
    },
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  queryParameters: [Parameters.apiVersion],
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.serviceName,
    Parameters.groupId,
    Parameters.userId,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const deleteOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/groups/{groupId}/users/{userId}",
  httpMethod: "DELETE",
  responses: {
    200: {},
    204: {},
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  queryParameters: [Parameters.apiVersion],
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.serviceName,
    Parameters.groupId,
    Parameters.userId,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const listNextOperationSpec: coreClient.OperationSpec = {
  path: "{nextLink}",
  httpMethod: "GET",
  responses: {
    200: {
      bodyMapper: Mappers.UserCollection,
    },
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.nextLink,
    Parameters.serviceName,
    Parameters.groupId,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
