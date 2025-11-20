// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * FILE: maor.spec.ts
 * DESCRIPTION:
 *    This sample demonstrates how to get, create, update, or delete an index.
 * USAGE:
 *    Set the environment variables with your own values before running the sample:
 *    1) SEARCH_API_ENDPOINT - the endpoint of your Azure AI Search service
 *    2) SEARCH_API_KEY - your search API key
 */

import type { SearchIndex, ScoringProfile } from "../src/index.js";
import { KnownSearchFieldDataType, SearchClient, SearchIndexClient } from "../src/index.js";
import { AzureKeyCredential } from "@azure/core-auth";
import { describe, it } from "vitest";

const endpoint = process.env["SEARCH_API_ENDPOINT"] || "";
const apiKey = process.env["SEARCH_API_KEY"] || "";

describe("Index CRUD Operations", () => {
  it("should create an index", async () => {
    // [START create_index]
    const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));
    const indexName = "hotels";

    const index: SearchIndex = {
      name: indexName,
      fields: [
        {
          name: "hotelId",
          type: KnownSearchFieldDataType.String,
          key: true,
        },
        {
          name: "hotelName",
          type: KnownSearchFieldDataType.String,
          searchable: true,
        },
        {
          name: "baseRate",
          type: KnownSearchFieldDataType.Double,
        },
        {
          name: "description",
          type: "Collection(Edm.String)",
          searchable: true,
        },
        {
          name: "address",
          type: "Collection(Edm.ComplexType)",
          fields: [
            {
              name: "streetAddress",
              type: KnownSearchFieldDataType.String,
            },
            {
              name: "city",
              type: KnownSearchFieldDataType.String,
            },
          ],
        },
      ],
      corsOptions: {
        allowedOrigins: ["*"],
        maxAgeInSeconds: 60,
      },
      scoringProfiles: [],
    };

    const result = await client.createIndex(index);
    console.log(`Index ${result.name} created`);
    // [END create_index]
  });

  it("should get an index", async () => {
    // [START get_index]
    const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));
    const indexName = "hotels";
    const result = await client.getIndex(indexName);
    console.log(`Retrieved index: ${result.name}`);
    // [END get_index]
  });

  it("should update an index", async () => {
    // [START update_index]
    const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));
    const indexName = "hotels";

    const scoringProfile: ScoringProfile = {
      name: "MyProfile",
      functionAggregation: "sum",
      functions: [],
    };

    const index: SearchIndex = {
      name: indexName,
      fields: [
        {
          name: "hotelId",
          type: KnownSearchFieldDataType.String,
          key: true,
        },
        {
          name: "hotelName",
          type: KnownSearchFieldDataType.String,
          searchable: true,
        },
        {
          name: "baseRate",
          type: KnownSearchFieldDataType.Double,
        },
        {
          name: "description",
          type: "Collection(Edm.String)",
          searchable: true,
        },
        {
          name: "address",
          type: "Collection(Edm.ComplexType)",
          fields: [
            {
              name: "streetAddress",
              type: KnownSearchFieldDataType.String,
            },
            {
              name: "city",
              type: KnownSearchFieldDataType.String,
            },
            {
              name: "state",
              type: KnownSearchFieldDataType.String,
            },
          ],
        },
      ],
      corsOptions: {
        allowedOrigins: ["*"],
        maxAgeInSeconds: 60,
      },
      scoringProfiles: [scoringProfile],
    };

    const result = await client.createOrUpdateIndex(index, indexName);
    console.log(`Index ${result.name} updated`);
    // [END update_index]
  });

  it("should delete an index", async () => {
    // [START delete_index]
    const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));
    const indexName = "hotels";
    await client.deleteIndex(indexName);
    console.log(`Index ${indexName} deleted`);
    // [END delete_index]
  });
});

describe("Search operations", async () => {
  it("works with pagination", async () => {
    const client = new SearchClient(
      endpoint,
      new AzureKeyCredential(apiKey),
      "realestate-us-sample-index1",
    );

    const results = await client.searchPost({
      searchText: "ho",
      includeTotalCount: true,
    });

    const count = new Set<string>();
    console.log("Search results for 'ho':", results.count);
    for await (const h of results.results) {
      console.log(`Found hotel with listingID ${h.additionalProperties?.listingId}`);
      count.add(h.additionalProperties?.listingId);
    }

    console.log(`Total hotel IDs found: ${count.size}`);
  });
});
