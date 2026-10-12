// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { TokenCredential } from "@azure/core-auth";
import type { HttpClient, PipelineRequest } from "@azure/core-rest-pipeline";
import { createHttpHeaders, isRestError } from "@azure/core-rest-pipeline";
import { assert, describe, it, vi } from "vitest";
import { BookshelfClient, WorkspaceClient, type KnowledgeBase } from "../../src/index.js";
import { BookshelfClient as SubpathBookshelfClient } from "../../src/bookshelf/index.js";
import { BookshelfClient as GeneratedBookshelfClient } from "../../src/generated/bookshelf/bookshelfClient.js";
import { WorkspaceClient as GeneratedWorkspaceClient } from "../../src/generated/workspace/workspaceClient.js";
import { createKnowledgeBasesOperations } from "../../src/customization/knowledgeBasesOperations.js";

const credential: TokenCredential = {
  getToken: async () => ({
    token: "mock-token",
    expiresOnTimestamp: Date.now() + 60_000,
  }),
};

const knowledgeBase: KnowledgeBase = {
  name: "foo",
  bookshelfName: "example-bookshelf",
  description: "A test knowledge base",
  copilotInstruction: "Use the test documents",
};

function createTransport(deleteStatus = 200): {
  httpClient: HttpClient;
  requests: PipelineRequest[];
} {
  const requests: PipelineRequest[] = [];
  return {
    requests,
    httpClient: {
      sendRequest: async (request) => {
        requests.push(request);
        return {
          request,
          status: request.method === "DELETE" ? deleteStatus : 200,
          headers: createHttpHeaders({ "content-type": "application/json" }),
          bodyAsText: JSON.stringify(
            request.method === "GET"
              ? knowledgeBase
              : deleteStatus === 200
                ? undefined
                : { error: { code: "NotFound", message: "Knowledge base not found" } },
          ),
        };
      },
    },
  };
}

describe("handwritten knowledge-base customization", () => {
  it("lets a customer get a model and then await delete(model)", async () => {
    const { httpClient, requests } = createTransport();
    const client = new BookshelfClient("https://example.test", credential, { httpClient });

    const kb = await client.knowledgeBases.get("foo");
    await client.knowledgeBases.delete(kb);

    assert.deepEqual(
      requests.map((request) => [request.method, new URL(request.url).pathname]),
      [
        ["GET", "/knowledgeBases/foo"],
        ["DELETE", "/knowledgeBases/foo"],
      ],
    );
  });

  it("also accepts a string name through the new convenience method", async () => {
    const { httpClient, requests } = createTransport();
    const client = new BookshelfClient("https://example.test", credential, { httpClient });

    await client.knowledgeBases.delete("foo");

    assert.equal(requests[0].method, "DELETE");
    assert.equal(new URL(requests[0].url).pathname, "/knowledgeBases/foo");
  });

  it("preserves the existing deleteKnowledgeBase(name) operation", async () => {
    const { httpClient, requests } = createTransport();
    const client = new BookshelfClient("https://example.test", credential, { httpClient });

    await client.knowledgeBases.deleteKnowledgeBase("foo");

    assert.equal(requests[0].method, "DELETE");
    assert.equal(new URL(requests[0].url).pathname, "/knowledgeBases/foo");
  });

  it("forwards the model's name and options and returns the exact generated poller", async () => {
    const { httpClient } = createTransport();
    const generatedClient = new GeneratedBookshelfClient("https://example.test", credential, {
      httpClient,
    });
    const generatedOperations = generatedClient.knowledgeBases;
    const deleteOperation = vi.spyOn(generatedOperations, "deleteKnowledgeBase");
    const operations = createKnowledgeBasesOperations(generatedOperations);
    const options = {
      updateIntervalInMs: 1,
      requestOptions: { headers: { "x-custom-header": "example" } },
    };

    const poller = operations.delete(knowledgeBase, options);

    assert.strictEqual(deleteOperation.mock.calls[0][0], knowledgeBase.name);
    assert.strictEqual(deleteOperation.mock.calls[0][1], options);
    assert.strictEqual(poller, deleteOperation.mock.results[0].value);
    assert.isFunction(poller.pollUntilDone);
    assert.strictEqual(operations.get, generatedOperations.get);
    assert.strictEqual(operations.search, generatedOperations.search);
    assert.strictEqual(operations.createOrUpdate, generatedOperations.createOrUpdate);
    assert.notProperty(generatedOperations, "delete");

    await poller;
  });

  it("preserves the generated operation's service errors", async () => {
    const { httpClient } = createTransport(404);
    const client = new BookshelfClient("https://example.test", credential, { httpClient });

    const error = await client.knowledgeBases
      .delete(knowledgeBase)
      .catch((cause: unknown) => cause);

    assert.isTrue(isRestError(error));
    if (!isRestError(error)) {
      throw new Error("Expected the generated operation to return a RestError");
    }
    assert.equal(error.statusCode, 404);
  });

  it("exports the subclass from both the package root and the bookshelf entry point", () => {
    assert.strictEqual(BookshelfClient, SubpathBookshelfClient);
    const client = new BookshelfClient("https://example.test", credential);
    assert.instanceOf(client, GeneratedBookshelfClient);
    assert.isFunction(client.knowledgeBases.delete);
  });

  it("keeps the unrelated WorkspaceClient as a direct generated export", () => {
    assert.strictEqual(WorkspaceClient, GeneratedWorkspaceClient);
  });
});
