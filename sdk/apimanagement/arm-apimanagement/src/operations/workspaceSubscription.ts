/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

import { PagedAsyncIterableIterator, PageSettings } from "@azure/core-paging";
import { setContinuationToken } from "../pagingHelper.js";
import { WorkspaceSubscription } from "../operationsInterfaces/index.js";
import * as coreClient from "@azure/core-client";
import * as Mappers from "../models/mappers.js";
import * as Parameters from "../models/parameters.js";
import { ApiManagementClient } from "../apiManagementClient.js";
import {
  SubscriptionContract,
  WorkspaceSubscriptionListNextOptionalParams,
  WorkspaceSubscriptionListOptionalParams,
  WorkspaceSubscriptionListResponse,
  WorkspaceSubscriptionGetEntityTagOptionalParams,
  WorkspaceSubscriptionGetEntityTagResponse,
  WorkspaceSubscriptionGetOptionalParams,
  WorkspaceSubscriptionGetResponse,
  SubscriptionCreateParameters,
  WorkspaceSubscriptionCreateOrUpdateOptionalParams,
  WorkspaceSubscriptionCreateOrUpdateResponse,
  SubscriptionUpdateParameters,
  WorkspaceSubscriptionUpdateOptionalParams,
  WorkspaceSubscriptionUpdateResponse,
  WorkspaceSubscriptionDeleteOptionalParams,
  WorkspaceSubscriptionRegeneratePrimaryKeyOptionalParams,
  WorkspaceSubscriptionRegenerateSecondaryKeyOptionalParams,
  WorkspaceSubscriptionListSecretsOptionalParams,
  WorkspaceSubscriptionListSecretsResponse,
  WorkspaceSubscriptionListNextResponse,
} from "../models/index.js";

/// <reference lib="esnext.asynciterable" />
/** Class containing WorkspaceSubscription operations. */
export class WorkspaceSubscriptionImpl implements WorkspaceSubscription {
  private readonly client: ApiManagementClient;

  /**
   * Initialize a new instance of the class WorkspaceSubscription class.
   * @param client Reference to the service client
   */
  constructor(client: ApiManagementClient) {
    this.client = client;
  }

  /**
   * Lists all subscriptions of the workspace in an API Management service instance.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param options The options parameters.
   */
  public list(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    options?: WorkspaceSubscriptionListOptionalParams,
  ): PagedAsyncIterableIterator<SubscriptionContract> {
    const iter = this.listPagingAll(
      resourceGroupName,
      serviceName,
      workspaceId,
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
    options?: WorkspaceSubscriptionListOptionalParams,
    settings?: PageSettings,
  ): AsyncIterableIterator<SubscriptionContract[]> {
    let result: WorkspaceSubscriptionListResponse;
    let continuationToken = settings?.continuationToken;
    if (!continuationToken) {
      result = await this._list(
        resourceGroupName,
        serviceName,
        workspaceId,
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
    options?: WorkspaceSubscriptionListOptionalParams,
  ): AsyncIterableIterator<SubscriptionContract> {
    for await (const page of this.listPagingPage(
      resourceGroupName,
      serviceName,
      workspaceId,
      options,
    )) {
      yield* page;
    }
  }

  /**
   * Lists all subscriptions of the workspace in an API Management service instance.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param options The options parameters.
   */
  private _list(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    options?: WorkspaceSubscriptionListOptionalParams,
  ): Promise<WorkspaceSubscriptionListResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, options },
      listOperationSpec,
    );
  }

  /**
   * Gets the entity state (Etag) version of the apimanagement subscription specified by its identifier.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param options The options parameters.
   */
  getEntityTag(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    options?: WorkspaceSubscriptionGetEntityTagOptionalParams,
  ): Promise<WorkspaceSubscriptionGetEntityTagResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, options },
      getEntityTagOperationSpec,
    );
  }

  /**
   * Gets the specified Subscription entity.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param options The options parameters.
   */
  get(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    options?: WorkspaceSubscriptionGetOptionalParams,
  ): Promise<WorkspaceSubscriptionGetResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, options },
      getOperationSpec,
    );
  }

  /**
   * Creates or updates the subscription of specified user to the specified product.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param parameters Create parameters.
   * @param options The options parameters.
   */
  createOrUpdate(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    parameters: SubscriptionCreateParameters,
    options?: WorkspaceSubscriptionCreateOrUpdateOptionalParams,
  ): Promise<WorkspaceSubscriptionCreateOrUpdateResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, parameters, options },
      createOrUpdateOperationSpec,
    );
  }

  /**
   * Updates the details of a subscription specified by its identifier.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param ifMatch ETag of the Entity. ETag should match the current entity state from the header
   *                response of the GET request or it should be * for unconditional update.
   * @param parameters Update parameters.
   * @param options The options parameters.
   */
  update(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    ifMatch: string,
    parameters: SubscriptionUpdateParameters,
    options?: WorkspaceSubscriptionUpdateOptionalParams,
  ): Promise<WorkspaceSubscriptionUpdateResponse> {
    return this.client.sendOperationRequest(
      {
        resourceGroupName,
        serviceName,
        workspaceId,
        sid,
        ifMatch,
        parameters,
        options,
      },
      updateOperationSpec,
    );
  }

  /**
   * Deletes the specified subscription.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param ifMatch ETag of the Entity. ETag should match the current entity state from the header
   *                response of the GET request or it should be * for unconditional update.
   * @param options The options parameters.
   */
  delete(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    ifMatch: string,
    options?: WorkspaceSubscriptionDeleteOptionalParams,
  ): Promise<void> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, ifMatch, options },
      deleteOperationSpec,
    );
  }

  /**
   * Regenerates primary key of existing subscription of the workspace in an API Management service
   * instance.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param options The options parameters.
   */
  regeneratePrimaryKey(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    options?: WorkspaceSubscriptionRegeneratePrimaryKeyOptionalParams,
  ): Promise<void> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, options },
      regeneratePrimaryKeyOperationSpec,
    );
  }

  /**
   * Regenerates secondary key of existing subscription of the workspace in an API Management service
   * instance.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param options The options parameters.
   */
  regenerateSecondaryKey(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    options?: WorkspaceSubscriptionRegenerateSecondaryKeyOptionalParams,
  ): Promise<void> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, options },
      regenerateSecondaryKeyOperationSpec,
    );
  }

  /**
   * Gets the specified Subscription keys.
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param sid Subscription entity Identifier. The entity represents the association between a user and
   *            a product in API Management.
   * @param options The options parameters.
   */
  listSecrets(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    sid: string,
    options?: WorkspaceSubscriptionListSecretsOptionalParams,
  ): Promise<WorkspaceSubscriptionListSecretsResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, sid, options },
      listSecretsOperationSpec,
    );
  }

  /**
   * ListNext
   * @param resourceGroupName The name of the resource group. The name is case insensitive.
   * @param serviceName The name of the API Management service.
   * @param workspaceId Workspace identifier. Must be unique in the current API Management service
   *                    instance.
   * @param nextLink The nextLink from the previous successful call to the List method.
   * @param options The options parameters.
   */
  private _listNext(
    resourceGroupName: string,
    serviceName: string,
    workspaceId: string,
    nextLink: string,
    options?: WorkspaceSubscriptionListNextOptionalParams,
  ): Promise<WorkspaceSubscriptionListNextResponse> {
    return this.client.sendOperationRequest(
      { resourceGroupName, serviceName, workspaceId, nextLink, options },
      listNextOperationSpec,
    );
  }
}
// Operation Specifications
const serializer = coreClient.createSerializer(Mappers, /* isXml */ false);

const listOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions",
  httpMethod: "GET",
  responses: {
    200: {
      bodyMapper: Mappers.SubscriptionCollection,
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
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const getEntityTagOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}",
  httpMethod: "HEAD",
  responses: {
    200: {
      headersMapper: Mappers.WorkspaceSubscriptionGetEntityTagHeaders,
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
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const getOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}",
  httpMethod: "GET",
  responses: {
    200: {
      bodyMapper: Mappers.SubscriptionContract,
      headersMapper: Mappers.WorkspaceSubscriptionGetHeaders,
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
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const createOrUpdateOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}",
  httpMethod: "PUT",
  responses: {
    200: {
      bodyMapper: Mappers.SubscriptionContract,
      headersMapper: Mappers.WorkspaceSubscriptionCreateOrUpdateHeaders,
    },
    201: {
      bodyMapper: Mappers.SubscriptionContract,
      headersMapper: Mappers.WorkspaceSubscriptionCreateOrUpdateHeaders,
    },
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  requestBody: Parameters.parameters79,
  queryParameters: [
    Parameters.apiVersion,
    Parameters.notify,
    Parameters.appType,
  ],
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.serviceName,
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [
    Parameters.contentType,
    Parameters.accept,
    Parameters.ifMatch,
  ],
  mediaType: "json",
  serializer,
};
const updateOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}",
  httpMethod: "PATCH",
  responses: {
    200: {
      bodyMapper: Mappers.SubscriptionContract,
      headersMapper: Mappers.WorkspaceSubscriptionUpdateHeaders,
    },
    default: {
      bodyMapper: Mappers.ErrorResponse,
    },
  },
  requestBody: Parameters.parameters80,
  queryParameters: [
    Parameters.apiVersion,
    Parameters.notify,
    Parameters.appType,
  ],
  urlParameters: [
    Parameters.$host,
    Parameters.resourceGroupName,
    Parameters.subscriptionId,
    Parameters.serviceName,
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [
    Parameters.contentType,
    Parameters.accept,
    Parameters.ifMatch1,
  ],
  mediaType: "json",
  serializer,
};
const deleteOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}",
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
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept, Parameters.ifMatch1],
  serializer,
};
const regeneratePrimaryKeyOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}/regeneratePrimaryKey",
  httpMethod: "POST",
  responses: {
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
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const regenerateSecondaryKeyOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}/regenerateSecondaryKey",
  httpMethod: "POST",
  responses: {
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
    Parameters.sid,
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
const listSecretsOperationSpec: coreClient.OperationSpec = {
  path: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/workspaces/{workspaceId}/subscriptions/{sid}/listSecrets",
  httpMethod: "POST",
  responses: {
    200: {
      bodyMapper: Mappers.SubscriptionKeysContract,
      headersMapper: Mappers.WorkspaceSubscriptionListSecretsHeaders,
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
    Parameters.sid,
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
      bodyMapper: Mappers.SubscriptionCollection,
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
    Parameters.workspaceId,
  ],
  headerParameters: [Parameters.accept],
  serializer,
};
