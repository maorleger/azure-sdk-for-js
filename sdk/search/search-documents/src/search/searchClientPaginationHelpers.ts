// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SearchContext } from "./api/index.js";
import { SearchDocumentsResult, SearchResult } from "../models/azure/search/documents/models.js";
import { SearchPostOptionalParams } from "./api/options.js";
import { searchPost } from "./api/operations.js";
import {
  PagedAsyncIterableIterator,
  PageSettings,
  ContinuablePage,
} from "../static-helpers/pagingHelpers.js";

export interface SearchPageSettings extends PageSettings {
  continuationToken?: string;
}

export type SearchResultPage = ContinuablePage<SearchResult, SearchDocumentsResult>;

export interface SearchDocumentsResultWithIterator extends Omit<SearchDocumentsResult, "results"> {
  readonly results: PagedAsyncIterableIterator<
    SearchResult,
    SearchDocumentsResult,
    SearchPageSettings
  >;
}

export function createSearchIterator(
  context: SearchContext,
  options: SearchPostOptionalParams,
  firstPageResult: SearchDocumentsResult,
): PagedAsyncIterableIterator<SearchResult, SearchDocumentsResult, SearchPageSettings> {
  async function* listSearchResultsPage(
    settings: SearchPageSettings = {},
  ): AsyncIterableIterator<SearchResultPage> {
    let result: SearchDocumentsResult;

    if (settings.continuationToken) {
      result = await searchPost(context, {
        ...options,
        ...decodeNextPageParameters(settings.continuationToken),
      });
    } else {
      result = firstPageResult;
    }

    let page = createSearchResultPage(result);
    yield page;

    while (page.continuationToken) {
      result = await searchPost(context, {
        ...options,
        ...decodeNextPageParameters(page.continuationToken),
      });
      page = createSearchResultPage(result);
      yield page;
    }
  }

  async function* listSearchResultsAll(): AsyncIterableIterator<SearchResult> {
    for await (const page of listSearchResultsPage()) {
      yield* page.results;
    }
  }

  const iter = listSearchResultsAll();

  return {
    next() {
      return iter.next();
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    byPage: (settings?: SearchPageSettings) => {
      return listSearchResultsPage(settings);
    },
  };
}

function createSearchResultPage(result: SearchDocumentsResult): SearchResultPage {
  const page = result as SearchResultPage;
  page.continuationToken = encodeNextPageParameters(result.nextLink, result.nextPageParameters);
  return page;
}

function encodeNextPageParameters(
  nextLink: string | undefined,
  nextPageParameters: any,
): string | undefined {
  if (!nextLink || !nextPageParameters) {
    return undefined;
  }
  const payload = JSON.stringify({
    nextLink,
    nextPageParameters,
  });
  return btoa(payload);
}

function decodeNextPageParameters(token?: string): Record<string, any> {
  if (!token) {
    return {};
  }

  try {
    const decodedToken = atob(token);
    const result = JSON.parse(decodedToken);
    return result.nextPageParameters || {};
  } catch (e: any) {
    throw new Error(`Corrupted or invalid continuation token: ${token}`);
  }
}
