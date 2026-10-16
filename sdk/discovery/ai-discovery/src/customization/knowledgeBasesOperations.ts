// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { OperationState, PollerLike } from "@azure/core-lro";
import type { KnowledgeBasesOperations as GeneratedKnowledgeBasesOperations } from "../generated/bookshelf/classic/knowledgeBases/index.js";
import type { KnowledgeBasesDeleteOptionalParams } from "../generated/bookshelf/api/knowledgeBases/options.js";
import type { KnowledgeBase } from "../generated/models/microsoft/discovery/bookshelf/models.js";

/** Knowledge-base operations with a model-based delete convenience method. */
export interface KnowledgeBasesOperations extends GeneratedKnowledgeBasesOperations {
  /**
   * Deletes a knowledge base by its name or by a model returned from the service.
   * @param knowledgeBase - The name or model of the knowledge base to delete.
   * @param options - Optional parameters for the delete operation.
   * @returns The generated operation's poller, which can also be awaited directly.
   */
  delete: (
    knowledgeBase: string | KnowledgeBase,
    options?: KnowledgeBasesDeleteOptionalParams,
  ) => PollerLike<OperationState<void>, void>;
}

/** Adds convenience methods without changing the generated operations. */
export function createKnowledgeBasesOperations(
  generated: GeneratedKnowledgeBasesOperations,
): KnowledgeBasesOperations {
  const { deleteKnowledgeBase, ...rest } = generated;
  return {
    ...rest,
    delete: (knowledgeBase, options) =>
      generated.deleteKnowledgeBase(
        typeof knowledgeBase === "string" ? knowledgeBase : knowledgeBase.name,
        options,
      ),
  };
}
