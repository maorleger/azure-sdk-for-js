// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { TokenCredential } from "@azure/core-auth";
import { BookshelfClient as GeneratedBookshelfClient } from "./generated/bookshelf/bookshelfClient.js";
import type { BookshelfClientOptionalParams } from "./generated/bookshelf/api/bookshelfContext.js";
import {
  createKnowledgeBasesOperations,
  type KnowledgeBasesOperations,
} from "./customization/knowledgeBasesOperations.js";

/**
 * Client for the Microsoft Discovery Bookshelf service with model-based knowledge-base deletion.
 */
export class BookshelfClient extends GeneratedBookshelfClient {
  /** Knowledge-base operations with model-based deletion. */
  // Refine the type without replacing the operation group initialized by the parent constructor.
  declare public readonly knowledgeBases: KnowledgeBasesOperations;

  /**
   * Creates a Bookshelf client.
   * @param endpointParam - The Discovery Bookshelf endpoint.
   * @param credential - Credential used to authenticate requests.
   * @param options - Optional parameters for configuring the client.
   */
  constructor(
    endpointParam: string,
    credential: TokenCredential,
    options: BookshelfClientOptionalParams = {},
  ) {
    super(endpointParam, credential, options);
    this.knowledgeBases = createKnowledgeBasesOperations(this.knowledgeBases);
  }
}
