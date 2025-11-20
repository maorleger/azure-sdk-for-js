// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  searchResourceEncryptionKeySerializer,
  searchResourceEncryptionKeyDeserializer,
  searchIndexerDataIdentityUnionSerializer,
  searchIndexerDataIdentityUnionDeserializer,
  SearchIndexerDataIdentityUnion,
  TokenFilter,
  VectorSearchVectorizerKind,
  knowledgeBaseModelUnionSerializer,
  knowledgeBaseModelUnionDeserializer,
  KnowledgeBaseModelUnion,
  AzureOpenAiParameters,
  azureOpenAiParametersSerializer,
  azureOpenAiParametersDeserializer,
  KnowledgeSource,
  IndexingSchedule,
  indexingScheduleSerializer,
  indexingScheduleDeserializer,
  CreatedResources,
  createdResourcesDeserializer,
} from "./azure/search/documents/indexes/models.js";

/**
 * This file contains only generated model types and their (de)serializers.
 * Disable the following rules for internal models with '_' prefix and deserializers which require 'any' for raw JSON input.
 */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/** Generates n-grams of the given size(s). This token filter is implemented using Apache Lucene. */
export interface NGramTokenFilterV2 extends TokenFilter {
  /** The minimum n-gram length. Default is 1. Maximum is 300. Must be less than the value of maxGram. */
  minGram?: number;
  /** The maximum n-gram length. Default is 2. Maximum is 300. */
  maxGram?: number;
  /** A URI fragment specifying the type of token filter. */
  odataType: "#Microsoft.Azure.Search.NGramTokenFilterV2";
}

export function nGramTokenFilterV2Serializer(item: NGramTokenFilterV2): any {
  return {
    "@odata.type": item["odatatype"],
    name: item["name"],
    minGram: item["minGram"],
    maxGram: item["maxGram"],
  };
}

export function nGramTokenFilterV2Deserializer(item: any): NGramTokenFilterV2 {
  return {
    odatatype: item["@odata.type"],
    name: item["name"],
    minGram: item["minGram"],
    maxGram: item["maxGram"],
    odataType: item["@odata.type"],
  };
}

export function searchIndexFieldReferenceArraySerializer(
  result: Array<SearchIndexFieldReference>,
): any[] {
  return result.map((item) => {
    return searchIndexFieldReferenceSerializer(item);
  });
}

export function searchIndexFieldReferenceArrayDeserializer(
  result: Array<SearchIndexFieldReference>,
): any[] {
  return result.map((item) => {
    return searchIndexFieldReferenceDeserializer(item);
  });
}

/** Field reference for a search index. */
export interface SearchIndexFieldReference {
  /** The name of the field. */
  name: string;
}

export function searchIndexFieldReferenceSerializer(item: SearchIndexFieldReference): any {
  return { name: item["name"] };
}

export function searchIndexFieldReferenceDeserializer(item: any): SearchIndexFieldReference {
  return {
    name: item["name"],
  };
}

/** Consolidates all general ingestion settings for knowledge sources. */
export interface KnowledgeSourceIngestionParameters {
  /** An explicit identity to use for this knowledge source. */
  identity?: SearchIndexerDataIdentityUnion;
  /** Optional vectorizer configuration for vectorizing content. */
  embeddingModel?: KnowledgeSourceVectorizerUnion;
  /** Optional chat completion model for image verbalization or context extraction. */
  chatCompletionModel?: KnowledgeBaseModelUnion;
  /** Indicates whether image verbalization should be disabled. Default is false. */
  disableImageVerbalization?: boolean;
  /** Optional schedule for data ingestion. */
  ingestionSchedule?: IndexingSchedule;
  /** Optional list of permission types to ingest together with document content. If specified, it will set the indexer permission options for the data source. */
  ingestionPermissionOptions?: KnowledgeSourceIngestionPermissionOption[];
  /** Optional content extraction mode. Default is 'minimal'. */
  contentExtractionMode?: KnowledgeSourceContentExtractionMode;
  /** Optional AI Services configuration for content processing. */
  aiServices?: AIServices;
}

export function knowledgeSourceIngestionParametersSerializer(
  item: KnowledgeSourceIngestionParameters,
): any {
  return {
    identity: !item["identity"]
      ? item["identity"]
      : searchIndexerDataIdentityUnionSerializer(item["identity"]),
    embeddingModel: !item["embeddingModel"]
      ? item["embeddingModel"]
      : knowledgeSourceVectorizerUnionSerializer(item["embeddingModel"]),
    chatCompletionModel: !item["chatCompletionModel"]
      ? item["chatCompletionModel"]
      : knowledgeBaseModelUnionSerializer(item["chatCompletionModel"]),
    disableImageVerbalization: item["disableImageVerbalization"],
    ingestionSchedule: !item["ingestionSchedule"]
      ? item["ingestionSchedule"]
      : indexingScheduleSerializer(item["ingestionSchedule"]),
    ingestionPermissionOptions: !item["ingestionPermissionOptions"]
      ? item["ingestionPermissionOptions"]
      : item["ingestionPermissionOptions"].map((p: any) => {
          return p;
        }),
    contentExtractionMode: item["contentExtractionMode"],
    aiServices: !item["aiServices"] ? item["aiServices"] : aiServicesSerializer(item["aiServices"]),
  };
}

export function knowledgeSourceIngestionParametersDeserializer(
  item: any,
): KnowledgeSourceIngestionParameters {
  return {
    identity: !item["identity"]
      ? item["identity"]
      : searchIndexerDataIdentityUnionDeserializer(item["identity"]),
    embeddingModel: !item["embeddingModel"]
      ? item["embeddingModel"]
      : knowledgeSourceVectorizerUnionDeserializer(item["embeddingModel"]),
    chatCompletionModel: !item["chatCompletionModel"]
      ? item["chatCompletionModel"]
      : knowledgeBaseModelUnionDeserializer(item["chatCompletionModel"]),
    disableImageVerbalization: item["disableImageVerbalization"],
    ingestionSchedule: !item["ingestionSchedule"]
      ? item["ingestionSchedule"]
      : indexingScheduleDeserializer(item["ingestionSchedule"]),
    ingestionPermissionOptions: !item["ingestionPermissionOptions"]
      ? item["ingestionPermissionOptions"]
      : item["ingestionPermissionOptions"].map((p: any) => {
          return p;
        }),
    contentExtractionMode: item["contentExtractionMode"],
    aiServices: !item["aiServices"]
      ? item["aiServices"]
      : aiServicesDeserializer(item["aiServices"]),
  };
}

/** Specifies the vectorization method to be used for knowledge source embedding model. */
export interface KnowledgeSourceVectorizer {
  /** The name of the kind of vectorization method being configured for use with vector search. */
  /** The discriminator possible values: azureOpenAI */
  kind: VectorSearchVectorizerKind;
}

export function knowledgeSourceVectorizerSerializer(item: KnowledgeSourceVectorizer): any {
  return { kind: item["kind"] };
}

export function knowledgeSourceVectorizerDeserializer(item: any): KnowledgeSourceVectorizer {
  return {
    kind: item["kind"],
  };
}

/** Alias for KnowledgeSourceVectorizerUnion */
export type KnowledgeSourceVectorizerUnion =
  | KnowledgeSourceAzureOpenAIVectorizer
  | KnowledgeSourceVectorizer;

export function knowledgeSourceVectorizerUnionSerializer(
  item: KnowledgeSourceVectorizerUnion,
): any {
  switch (item.kind) {
    case "azureOpenAI":
      return knowledgeSourceAzureOpenAIVectorizerSerializer(
        item as KnowledgeSourceAzureOpenAIVectorizer,
      );

    default:
      return knowledgeSourceVectorizerSerializer(item);
  }
}

export function knowledgeSourceVectorizerUnionDeserializer(
  item: any,
): KnowledgeSourceVectorizerUnion {
  switch (item.kind) {
    case "azureOpenAI":
      return knowledgeSourceAzureOpenAIVectorizerDeserializer(
        item as KnowledgeSourceAzureOpenAIVectorizer,
      );

    default:
      return knowledgeSourceVectorizerDeserializer(item);
  }
}

/** Specifies the Azure OpenAI resource used to vectorize a query string. */
export interface KnowledgeSourceAzureOpenAIVectorizer extends KnowledgeSourceVectorizer {
  /** The discriminator value. */
  kind: "azureOpenAI";
  /** Contains the parameters specific to Azure OpenAI embedding vectorization. */
  azureOpenAIParameters?: AzureOpenAiParameters;
}

export function knowledgeSourceAzureOpenAIVectorizerSerializer(
  item: KnowledgeSourceAzureOpenAIVectorizer,
): any {
  return {
    kind: item["kind"],
    azureOpenAIParameters: !item["azureOpenAIParameters"]
      ? item["azureOpenAIParameters"]
      : azureOpenAiParametersSerializer(item["azureOpenAIParameters"]),
  };
}

export function knowledgeSourceAzureOpenAIVectorizerDeserializer(
  item: any,
): KnowledgeSourceAzureOpenAIVectorizer {
  return {
    kind: item["kind"],
    azureOpenAIParameters: !item["azureOpenAIParameters"]
      ? item["azureOpenAIParameters"]
      : azureOpenAiParametersDeserializer(item["azureOpenAIParameters"]),
  };
}

/** Permission types to ingest together with document content. */
export enum KnownKnowledgeSourceIngestionPermissionOption {
  /** Ingest explicit user identifiers alongside document content. */
  UserIds = "userIds",
  /** Ingest group identifiers alongside document content. */
  GroupIds = "groupIds",
  /** Ingest RBAC scope information alongside document content. */
  RbacScope = "rbacScope",
}

/**
 * Permission types to ingest together with document content. \
 * {@link KnownKnowledgeSourceIngestionPermissionOption} can be used interchangeably with KnowledgeSourceIngestionPermissionOption,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **userIds**: Ingest explicit user identifiers alongside document content. \
 * **groupIds**: Ingest group identifiers alongside document content. \
 * **rbacScope**: Ingest RBAC scope information alongside document content.
 */
export type KnowledgeSourceIngestionPermissionOption = string;

/** Optional content extraction mode. Default is 'minimal'. */
export enum KnownKnowledgeSourceContentExtractionMode {
  /** Extracts only essential metadata while deferring most content processing. */
  Minimal = "minimal",
  /** Performs the full default content extraction pipeline. */
  Standard = "standard",
}

/**
 * Optional content extraction mode. Default is 'minimal'. \
 * {@link KnownKnowledgeSourceContentExtractionMode} can be used interchangeably with KnowledgeSourceContentExtractionMode,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **minimal**: Extracts only essential metadata while deferring most content processing. \
 * **standard**: Performs the full default content extraction pipeline.
 */
export type KnowledgeSourceContentExtractionMode = string;

/** Parameters for AI Services. */
export interface AIServices {
  /** The URI of the AI Services endpoint. */
  uri: string;
  /** The API key for accessing AI Services. */
  apiKey?: string;
}

export function aiServicesSerializer(item: AIServices): any {
  return { uri: item["uri"], apiKey: item["apiKey"] };
}

export function aiServicesDeserializer(item: any): AIServices {
  return {
    uri: item["uri"],
    apiKey: item["apiKey"],
  };
}

/** Configuration for SharePoint knowledge source. */
export interface IndexedSharePointKnowledgeSource extends KnowledgeSource {
  kind: "indexedSharePoint";
  /** The parameters for the knowledge source. */
  indexedSharePointParameters: IndexedSharePointKnowledgeSourceParameters;
}

export function indexedSharePointKnowledgeSourceSerializer(
  item: IndexedSharePointKnowledgeSource,
): any {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    "@odata.etag": item["eTag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeySerializer(item["encryptionKey"]),
    indexedSharePointParameters: indexedSharePointKnowledgeSourceParametersSerializer(
      item["indexedSharePointParameters"],
    ),
  };
}

export function indexedSharePointKnowledgeSourceDeserializer(
  item: any,
): IndexedSharePointKnowledgeSource {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    eTag: item["@odata.etag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeyDeserializer(item["encryptionKey"]),
    indexedSharePointParameters: indexedSharePointKnowledgeSourceParametersDeserializer(
      item["indexedSharePointParameters"],
    ),
  };
}

/** Parameters for SharePoint knowledge source. */
export interface IndexedSharePointKnowledgeSourceParameters {
  /** An explicit identity to use for this knowledge source. */
  identity?: SearchIndexerDataIdentityUnion;
  /** The connection string for the SharePoint site. */
  connectionString: string;
  /** The name of the SharePoint container. */
  containerName: string;
  /** SharePoint query. */
  query?: string;
  /** The embedding model to use for vectorization. */
  embeddingModel?: KnowledgeSourceVectorizerUnion;
  /** The chat completion model to use for understanding images. */
  chatCompletionModel?: KnowledgeBaseModelUnion;
  /** Ingestion parameters. */
  ingestionParameters?: KnowledgeSourceIngestionParameters;
  /** Resources created for this knowledge source. These resources are managed by the service and should not be modified or deleted. */
  readonly createdResources?: CreatedResources;
  /** If true, images will not be verbalized using the chatCompletionModel. */
  disableImageVerbalization?: boolean;
}

export function indexedSharePointKnowledgeSourceParametersSerializer(
  item: IndexedSharePointKnowledgeSourceParameters,
): any {
  return {
    identity: !item["identity"]
      ? item["identity"]
      : searchIndexerDataIdentityUnionSerializer(item["identity"]),
    connectionString: item["connectionString"],
    containerName: item["containerName"],
    query: item["query"],
    embeddingModel: !item["embeddingModel"]
      ? item["embeddingModel"]
      : knowledgeSourceVectorizerUnionSerializer(item["embeddingModel"]),
    chatCompletionModel: !item["chatCompletionModel"]
      ? item["chatCompletionModel"]
      : knowledgeBaseModelUnionSerializer(item["chatCompletionModel"]),
    ingestionParameters: !item["ingestionParameters"]
      ? item["ingestionParameters"]
      : knowledgeSourceIngestionParametersSerializer(item["ingestionParameters"]),
    disableImageVerbalization: item["disableImageVerbalization"],
  };
}

export function indexedSharePointKnowledgeSourceParametersDeserializer(
  item: any,
): IndexedSharePointKnowledgeSourceParameters {
  return {
    identity: !item["identity"]
      ? item["identity"]
      : searchIndexerDataIdentityUnionDeserializer(item["identity"]),
    connectionString: item["connectionString"],
    containerName: item["containerName"],
    query: item["query"],
    embeddingModel: !item["embeddingModel"]
      ? item["embeddingModel"]
      : knowledgeSourceVectorizerUnionDeserializer(item["embeddingModel"]),
    chatCompletionModel: !item["chatCompletionModel"]
      ? item["chatCompletionModel"]
      : knowledgeBaseModelUnionDeserializer(item["chatCompletionModel"]),
    ingestionParameters: !item["ingestionParameters"]
      ? item["ingestionParameters"]
      : knowledgeSourceIngestionParametersDeserializer(item["ingestionParameters"]),
    createdResources: !item["createdResources"]
      ? item["createdResources"]
      : createdResourcesDeserializer(item["createdResources"]),
    disableImageVerbalization: item["disableImageVerbalization"],
  };
}

/** Configuration for OneLake knowledge source. */
export interface IndexedOneLakeKnowledgeSource extends KnowledgeSource {
  kind: "indexedOneLake";
  /** The parameters for the knowledge source. */
  indexedOneLakeParameters: IndexedOneLakeKnowledgeSourceParameters;
}

export function indexedOneLakeKnowledgeSourceSerializer(item: IndexedOneLakeKnowledgeSource): any {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    "@odata.etag": item["eTag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeySerializer(item["encryptionKey"]),
    indexedOneLakeParameters: indexedOneLakeKnowledgeSourceParametersSerializer(
      item["indexedOneLakeParameters"],
    ),
  };
}

export function indexedOneLakeKnowledgeSourceDeserializer(
  item: any,
): IndexedOneLakeKnowledgeSource {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    eTag: item["@odata.etag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeyDeserializer(item["encryptionKey"]),
    indexedOneLakeParameters: indexedOneLakeKnowledgeSourceParametersDeserializer(
      item["indexedOneLakeParameters"],
    ),
  };
}

/** Parameters for OneLake knowledge source. */
export interface IndexedOneLakeKnowledgeSourceParameters {
  /** OneLake workspace ID. */
  fabricWorkspaceId: string;
  /** Specifies which OneLake lakehouse to access. */
  lakehouseId: string;
  /** Optional OneLakehouse folder or shortcut to filter OneLake content. */
  targetPath?: string;
  /** Consolidates all general ingestion settings. */
  ingestionParameters?: KnowledgeSourceIngestionParameters;
  /** Resources created by the knowledge source. */
  readonly createdResources?: CreatedResources;
}

export function indexedOneLakeKnowledgeSourceParametersSerializer(
  item: IndexedOneLakeKnowledgeSourceParameters,
): any {
  return {
    fabricWorkspaceId: item["fabricWorkspaceId"],
    lakehouseId: item["lakehouseId"],
    targetPath: item["targetPath"],
    ingestionParameters: !item["ingestionParameters"]
      ? item["ingestionParameters"]
      : knowledgeSourceIngestionParametersSerializer(item["ingestionParameters"]),
  };
}

export function indexedOneLakeKnowledgeSourceParametersDeserializer(
  item: any,
): IndexedOneLakeKnowledgeSourceParameters {
  return {
    fabricWorkspaceId: item["fabricWorkspaceId"],
    lakehouseId: item["lakehouseId"],
    targetPath: item["targetPath"],
    ingestionParameters: !item["ingestionParameters"]
      ? item["ingestionParameters"]
      : knowledgeSourceIngestionParametersDeserializer(item["ingestionParameters"]),
    createdResources: !item["createdResources"]
      ? item["createdResources"]
      : createdResourcesDeserializer(item["createdResources"]),
  };
}

/** Knowledge Source targeting web results. */
export interface WebKnowledgeSource extends KnowledgeSource {
  kind: "web";
  /** The parameters for the web knowledge source. */
  webParameters?: WebKnowledgeSourceParameters;
}

export function webKnowledgeSourceSerializer(item: WebKnowledgeSource): any {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    "@odata.etag": item["eTag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeySerializer(item["encryptionKey"]),
    webParameters: !item["webParameters"]
      ? item["webParameters"]
      : webKnowledgeSourceParametersSerializer(item["webParameters"]),
  };
}

export function webKnowledgeSourceDeserializer(item: any): WebKnowledgeSource {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    eTag: item["@odata.etag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeyDeserializer(item["encryptionKey"]),
    webParameters: !item["webParameters"]
      ? item["webParameters"]
      : webKnowledgeSourceParametersDeserializer(item["webParameters"]),
  };
}

/** Parameters for web knowledge source. */
export interface WebKnowledgeSourceParameters {
  /** Domain allow/block configuration for web results. */
  domains?: WebKnowledgeSourceDomains;
}

export function webKnowledgeSourceParametersSerializer(item: WebKnowledgeSourceParameters): any {
  return {
    domains: !item["domains"]
      ? item["domains"]
      : webKnowledgeSourceDomainsSerializer(item["domains"]),
  };
}

export function webKnowledgeSourceParametersDeserializer(item: any): WebKnowledgeSourceParameters {
  return {
    domains: !item["domains"]
      ? item["domains"]
      : webKnowledgeSourceDomainsDeserializer(item["domains"]),
  };
}

/** Domain allow/block configuration for web knowledge source. */
export interface WebKnowledgeSourceDomains {
  /** Domains that are allowed for web results. */
  allowedDomains?: WebKnowledgeSourceDomain[];
  /** Domains that are blocked from web results. */
  blockedDomains?: WebKnowledgeSourceDomain[];
}

export function webKnowledgeSourceDomainsSerializer(item: WebKnowledgeSourceDomains): any {
  return {
    allowedDomains: !item["allowedDomains"]
      ? item["allowedDomains"]
      : webKnowledgeSourceDomainArraySerializer(item["allowedDomains"]),
    blockedDomains: !item["blockedDomains"]
      ? item["blockedDomains"]
      : webKnowledgeSourceDomainArraySerializer(item["blockedDomains"]),
  };
}

export function webKnowledgeSourceDomainsDeserializer(item: any): WebKnowledgeSourceDomains {
  return {
    allowedDomains: !item["allowedDomains"]
      ? item["allowedDomains"]
      : webKnowledgeSourceDomainArrayDeserializer(item["allowedDomains"]),
    blockedDomains: !item["blockedDomains"]
      ? item["blockedDomains"]
      : webKnowledgeSourceDomainArrayDeserializer(item["blockedDomains"]),
  };
}

export function webKnowledgeSourceDomainArraySerializer(
  result: Array<WebKnowledgeSourceDomain>,
): any[] {
  return result.map((item) => {
    return webKnowledgeSourceDomainSerializer(item);
  });
}

export function webKnowledgeSourceDomainArrayDeserializer(
  result: Array<WebKnowledgeSourceDomain>,
): any[] {
  return result.map((item) => {
    return webKnowledgeSourceDomainDeserializer(item);
  });
}

/** Configuration for web knowledge source domain. */
export interface WebKnowledgeSourceDomain {
  /** The address of the domain. */
  address: string;
  /** Whether or not to include subpages from this domain. */
  includeSubpages?: boolean;
}

export function webKnowledgeSourceDomainSerializer(item: WebKnowledgeSourceDomain): any {
  return { address: item["address"], includeSubpages: item["includeSubpages"] };
}

export function webKnowledgeSourceDomainDeserializer(item: any): WebKnowledgeSourceDomain {
  return {
    address: item["address"],
    includeSubpages: item["includeSubpages"],
  };
}

/** Configuration for remote SharePoint knowledge source. */
export interface RemoteSharePointKnowledgeSource extends KnowledgeSource {
  kind: "remoteSharePoint";
  /** The parameters for the remote SharePoint knowledge source. */
  remoteSharePointParameters: RemoteSharePointKnowledgeSourceParameters;
}

export function remoteSharePointKnowledgeSourceSerializer(
  item: RemoteSharePointKnowledgeSource,
): any {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    "@odata.etag": item["eTag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeySerializer(item["encryptionKey"]),
    remoteSharePointParameters: remoteSharePointKnowledgeSourceParametersSerializer(
      item["remoteSharePointParameters"],
    ),
  };
}

export function remoteSharePointKnowledgeSourceDeserializer(
  item: any,
): RemoteSharePointKnowledgeSource {
  return {
    name: item["name"],
    description: item["description"],
    kind: item["kind"],
    eTag: item["@odata.etag"],
    encryptionKey: !item["encryptionKey"]
      ? item["encryptionKey"]
      : searchResourceEncryptionKeyDeserializer(item["encryptionKey"]),
    remoteSharePointParameters: remoteSharePointKnowledgeSourceParametersDeserializer(
      item["remoteSharePointParameters"],
    ),
  };
}

/** Parameters for remote SharePoint knowledge source. */
export interface RemoteSharePointKnowledgeSourceParameters {
  /** Keyword Query Language (KQL) expression with queryable SharePoint properties and attributes to scope the retrieval before the query runs. */
  filterExpression?: string;
  /** A list of metadata fields to be returned for each item in the response. Only retrievable metadata properties can be included in this list. By default, no metadata is returned. */
  resourceMetadata?: string[];
  /** Container ID for SharePoint Embedded connection. When this is null, it will use SharePoint Online. */
  containerTypeId?: string;
}

export function remoteSharePointKnowledgeSourceParametersSerializer(
  item: RemoteSharePointKnowledgeSourceParameters,
): any {
  return {
    filterExpression: item["filterExpression"],
    resourceMetadata: !item["resourceMetadata"]
      ? item["resourceMetadata"]
      : item["resourceMetadata"].map((p: any) => {
          return p;
        }),
    containerTypeId: item["containerTypeId"],
  };
}

export function remoteSharePointKnowledgeSourceParametersDeserializer(
  item: any,
): RemoteSharePointKnowledgeSourceParameters {
  return {
    filterExpression: item["filterExpression"],
    resourceMetadata: !item["resourceMetadata"]
      ? item["resourceMetadata"]
      : item["resourceMetadata"].map((p: any) => {
          return p;
        }),
    containerTypeId: item["containerTypeId"],
  };
}

/** Represents service-level indexer runtime counters. */
export interface ServiceIndexersRuntime {
  /** Cumulative runtime of all indexers in the service from the beginningTime to endingTime, in seconds. */
  usedSeconds: number;
  /** Cumulative runtime remaining for all indexers in the service from the beginningTime to endingTime, in seconds. */
  remainingSeconds?: number;
  /** Beginning UTC time of the 24-hour period considered for indexer runtime usage (inclusive). */
  beginningTime: Date;
  /** End UTC time of the 24-hour period considered for indexer runtime usage (inclusive). */
  endingTime: Date;
}

export function serviceIndexersRuntimeDeserializer(item: any): ServiceIndexersRuntime {
  return {
    usedSeconds: item["usedSeconds"],
    remainingSeconds: item["remainingSeconds"],
    beginningTime: new Date(item["beginningTime"]),
    endingTime: new Date(item["endingTime"]),
  };
}

/** Represents the indexer's cumulative runtime consumption in the service. */
export interface IndexerRuntime {
  /** Cumulative runtime of the indexer from the beginningTime to endingTime, in seconds. */
  usedSeconds: number;
  /** Cumulative runtime remaining for all indexers in the service from the beginningTime to endingTime, in seconds. */
  remainingSeconds?: number;
  /** Beginning UTC time of the 24-hour period considered for indexer runtime usage (inclusive). */
  beginningTime: Date;
  /** End UTC time of the 24-hour period considered for indexer runtime usage (inclusive). */
  endingTime: Date;
}

export function indexerRuntimeDeserializer(item: any): IndexerRuntime {
  return {
    usedSeconds: item["usedSeconds"],
    remainingSeconds: item["remainingSeconds"],
    beginningTime: new Date(item["beginningTime"]),
    endingTime: new Date(item["endingTime"]),
  };
}

/** The type of activity record. */
export enum KnownKnowledgeBaseActivityRecordType {
  /** Search index retrieval activity. */
  SearchIndex = "searchIndex",
  /** Azure Blob retrieval activity. */
  AzureBlob = "azureBlob",
  /** Indexed SharePoint retrieval activity. */
  IndexedSharePoint = "indexedSharePoint",
  /** Indexed OneLake retrieval activity. */
  IndexedOneLake = "indexedOneLake",
  /** Web retrieval activity. */
  Web = "web",
  /** Remote SharePoint retrieval activity. */
  RemoteSharePoint = "remoteSharePoint",
  /** LLM query planning activity. */
  ModelQueryPlanning = "modelQueryPlanning",
  /** LLM answer synthesis activity. */
  ModelAnswerSynthesis = "modelAnswerSynthesis",
  /** Agentic reasoning activity. */
  AgenticReasoning = "agenticReasoning",
}

/**
 * The type of activity record. \
 * {@link KnownKnowledgeBaseActivityRecordType} can be used interchangeably with KnowledgeBaseActivityRecordType,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **searchIndex**: Search index retrieval activity. \
 * **azureBlob**: Azure Blob retrieval activity. \
 * **indexedSharePoint**: Indexed SharePoint retrieval activity. \
 * **indexedOneLake**: Indexed OneLake retrieval activity. \
 * **web**: Web retrieval activity. \
 * **remoteSharePoint**: Remote SharePoint retrieval activity. \
 * **modelQueryPlanning**: LLM query planning activity. \
 * **modelAnswerSynthesis**: LLM answer synthesis activity. \
 * **agenticReasoning**: Agentic reasoning activity.
 */
export type KnowledgeBaseActivityRecordType = string;

/** The type of reference. */
export enum KnownKnowledgeBaseReferenceType {
  /** Search index document reference. */
  SearchIndex = "searchIndex",
  /** Azure Blob document reference. */
  AzureBlob = "azureBlob",
  /** Indexed SharePoint document reference. */
  IndexedSharePoint = "indexedSharePoint",
  /** Indexed OneLake document reference. */
  IndexedOneLake = "indexedOneLake",
  /** Web document reference. */
  Web = "web",
  /** Remote SharePoint document reference. */
  RemoteSharePoint = "remoteSharePoint",
}

/**
 * The type of reference. \
 * {@link KnownKnowledgeBaseReferenceType} can be used interchangeably with KnowledgeBaseReferenceType,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **searchIndex**: Search index document reference. \
 * **azureBlob**: Azure Blob document reference. \
 * **indexedSharePoint**: Indexed SharePoint document reference. \
 * **indexedOneLake**: Indexed OneLake document reference. \
 * **web**: Web document reference. \
 * **remoteSharePoint**: Remote SharePoint document reference.
 */
export type KnowledgeBaseReferenceType = string;

/** Represents the status and synchronization history of a knowledge source. */
export interface KnowledgeSourceStatus {
  /** The current synchronization status. */
  synchronizationStatus: KnowledgeSourceSynchronizationStatus;
  /** The synchronization interval (e.g., '1d' for daily). Null if no schedule is configured. */
  synchronizationInterval?: string;
  /** Current synchronization state that spans multiple indexer runs. */
  currentSynchronizationState?: SynchronizationState;
  /** Details of the last completed synchronization. Null on first sync. */
  lastSynchronizationState?: CompletedSynchronizationState;
  /** Statistical information about the knowledge source synchronization history. Null on first sync. */
  statistics?: KnowledgeSourceStatistics;
}

export function knowledgeSourceStatusSerializer(item: KnowledgeSourceStatus): any {
  return {
    synchronizationStatus: item["synchronizationStatus"],
    synchronizationInterval: item["synchronizationInterval"],
    currentSynchronizationState: !item["currentSynchronizationState"]
      ? item["currentSynchronizationState"]
      : synchronizationStateSerializer(item["currentSynchronizationState"]),
    lastSynchronizationState: !item["lastSynchronizationState"]
      ? item["lastSynchronizationState"]
      : completedSynchronizationStateSerializer(item["lastSynchronizationState"]),
    statistics: !item["statistics"]
      ? item["statistics"]
      : knowledgeSourceStatisticsSerializer(item["statistics"]),
  };
}

/** The current synchronization status of the knowledge source. */
export enum KnownKnowledgeSourceSynchronizationStatus {
  /** The knowledge source is being provisioned. */
  Creating = "creating",
  /** The knowledge source is active and synchronization runs are occurring. */
  Active = "active",
  /** The knowledge source is being deleted and synchronization is paused. */
  Deleting = "deleting",
}

/**
 * The current synchronization status of the knowledge source. \
 * {@link KnownKnowledgeSourceSynchronizationStatus} can be used interchangeably with KnowledgeSourceSynchronizationStatus,
 *  this enum contains the known values that the service supports.
 * ### Known values supported by the service
 * **creating**: The knowledge source is being provisioned. \
 * **active**: The knowledge source is active and synchronization runs are occurring. \
 * **deleting**: The knowledge source is being deleted and synchronization is paused.
 */
export type KnowledgeSourceSynchronizationStatus = string;

/** Represents the current state of an ongoing synchronization that spans multiple indexer runs. */
export interface SynchronizationState {
  /** The start time of the current synchronization. */
  startTime: Date;
  /** The number of item updates successfully processed in the current synchronization. */
  itemsUpdatesProcessed: number;
  /** The number of item updates that failed in the current synchronization. */
  itemsUpdatesFailed: number;
  /** The number of items skipped in the current synchronization. */
  itemsSkipped: number;
}

export function synchronizationStateSerializer(item: SynchronizationState): any {
  return {
    startTime: item["startTime"].toISOString(),
    itemsUpdatesProcessed: item["itemsUpdatesProcessed"],
    itemsUpdatesFailed: item["itemsUpdatesFailed"],
    itemsSkipped: item["itemsSkipped"],
  };
}

/** Represents the completed state of the last synchronization. */
export interface CompletedSynchronizationState {
  /** The start time of the last completed synchronization. */
  startTime: Date;
  /** The end time of the last completed synchronization. */
  endTime: Date;
  /** The number of item updates successfully processed in the last synchronization. */
  itemsUpdatesProcessed: number;
  /** The number of item updates that failed in the last synchronization. */
  itemsUpdatesFailed: number;
  /** The number of items skipped in the last synchronization. */
  itemsSkipped: number;
}

export function completedSynchronizationStateSerializer(item: CompletedSynchronizationState): any {
  return {
    startTime: item["startTime"].toISOString(),
    endTime: item["endTime"].toISOString(),
    itemsUpdatesProcessed: item["itemsUpdatesProcessed"],
    itemsUpdatesFailed: item["itemsUpdatesFailed"],
    itemsSkipped: item["itemsSkipped"],
  };
}

/** Statistical information about knowledge source synchronization history. */
export interface KnowledgeSourceStatistics {
  /** Total number of synchronizations. */
  totalSynchronization: number;
  /** Average synchronization duration in HH:MM:SS format. */
  averageSynchronizationDuration: string;
  /** Average items processed per synchronization. */
  averageItemsProcessedPerSynchronization: number;
}

export function knowledgeSourceStatisticsSerializer(item: KnowledgeSourceStatistics): any {
  return {
    totalSynchronization: item["totalSynchronization"],
    averageSynchronizationDuration: item["averageSynchronizationDuration"],
    averageItemsProcessedPerSynchronization: item["averageItemsProcessedPerSynchronization"],
  };
}

/** The available API versions. */
export enum KnownVersions {
  /** The 2025-11-01-preview API version. */
  V20251101Preview = "2025-11-01-preview",
}
