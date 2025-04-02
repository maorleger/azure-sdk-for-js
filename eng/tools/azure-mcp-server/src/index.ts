import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import { z } from "zod";
import { parseLogFile } from "./recorder.js";
import TurndownService from "turndown";

// Create an MCP server
const server = new McpServer({
  name: "Azure SDK Support",
  version: "1.0.0",
});

// Requires env var Logging__LogLevel__Default=Debug to get the sanitizer info
server.tool(
  "recorder_errors",
  "searches test proxy logs for recorder mismatch errors",
  { directory: z.string() },
  ({ directory }) => {
    // TODO: parameterize this of course
    const logs = readFileSync(
      "/home/maorleger/workspace/azure-sdk-for-js/sdk/keyvault/keyvault-admin/testProxyOutput.log",
      "utf-8",
    );

    const { recordingMismatches, sanitizerInfo } = parseLogFile(logs);
    return {
      content: [
        {
          type: "text",
          text: recordingMismatches.join("\n"),
        },
        {
          type: "text",
          text: JSON.stringify(sanitizerInfo),
        },
      ],
    };
  },
);

server.tool("architect_review", "provides context for architect review", {}, async () => {
  const timeout = AbortSignal.timeout(2000);
  const documentationUrls = {
    general: [
      // "https://azure.github.io/azure-sdk/general_introduction.html",
      // "https://azure.github.io/azure-sdk/general_terminology.html",
      // "https://azure.github.io/azure-sdk/general_design.html",
      // "https://azure.github.io/azure-sdk/general_implementation.html",
      // "https://azure.github.io/azure-sdk/general_documentation.html",
      // "https://azure.github.io/azure-sdk/general_azurecore.html",
    ],
    typescript: [
      "https://azure.github.io/azure-sdk/typescript_introduction.html",
      "https://azure.github.io/azure-sdk/typescript_design.html",
      "https://azure.github.io/azure-sdk/typescript_implementation.html",
      "https://azure.github.io/azure-sdk/typescript_documentation.html",
    ],
    implementation: [
      // "https://github.com/Azure/azure-sdk/blob/main/docs/policies/repostructure.md",
      // "https://azure.github.io/azure-sdk/typescript_introduction.html",
      // "https://github.com/Azure/azure-sdk-for-js/blob/main/documentation/Quickstart-on-how-to-write-tests.md",
      // "https://github.com/Azure/azure-sdk-for-js/blob/main/documentation/linting.md",
    ],
  };

  // Flatten all URLs into a single array of fetch requests with error handling
  const fetchRequests = Object.values(documentationUrls)
    .flat()
    .map((url) => fetch(url, { signal: timeout }));

  const fetchResults = await Promise.allSettled(fetchRequests);

  const td = new TurndownService();
  const guidelines = Object.values(fetchResults)
    .filter((v) => v.status === "fulfilled" && (v.value as Response).ok)
    .map(async (v) => {
      const response = (v as PromiseFulfilledResult<Response>).value;
      const text = await response.text();
      return td.turndown(text);
    });

  const resolvedGuidelines = (await Promise.all(guidelines)).join("\n\n");

  // TODO: this is not working today, but ideally we would have not only the guidelines but also parse the AST
  // and provide the user with the specific guidelines that apply to the code they are writing

  return {
    content: [
      {
        type: "text",
        text: "Always ensure the code conforms to the guidelines provided in " + resolvedGuidelines,
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure MCP server started");
}

main().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
