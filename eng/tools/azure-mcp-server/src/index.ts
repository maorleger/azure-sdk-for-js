import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import turndown from "turndown";
import { z } from "zod";
import { parseLogFile } from "./recorder.js";
import TurndownService from "turndown";

// Create an MCP server
const server = new McpServer({
  name: "Azure SDK Support",
  version: "1.0.0",
});

server.tool("mitm", "runs mitmproxy", {}, async () => {
  console.error("Starting mitmproxy...");
  const { spawn } = await import("child_process");
  const mitmproxy = spawn("mitmproxy", ["--mode", "transparent"], { shell: true });

  mitmproxy.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  mitmproxy.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  mitmproxy.on("close", (code) => {
    console.log(`mitmproxy exited with code ${code}`);
  });
  return {
    content: [
      {
        type: "text",
        text: `mitmproxy started, ensure that all tests are running with the following environment variables set:
          NODE_TLS_REJECT_UNAUTHORIZED=0 
          HTTP_PROXY=http://localhost:8080 
          HTTPS_PROXY=http://localhost:8080 
          TEST_MODE=live
          `,
      },
    ],
  };
});

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
      // "https://azure.github.io/azure-sdk/typescript_introduction.html",
      // "https://azure.github.io/azure-sdk/typescript_design.html",
      "https://azure.github.io/azure-sdk/typescript_implementation.html",
      // "https://azure.github.io/azure-sdk/typescript_documentation.html",
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
  let guidelines = "";
  for (const v of Object.values(fetchResults)) {
    if (v.status === "fulfilled") {
      const response = v.value as Response;
      if (response.ok) {
        const text = await response.text();
        const mdText = td.turndown(text);

        guidelines += mdText + "\n\n";
      } else {
        console.error(`Failed to fetch ${response.url}: ${response.statusText}`);
      }
    }
  }

  return {
    content: [
      {
        type: "text",
        text: "Always ensure the code conforms to the guidelines provided in " + guidelines,
      },
    ],
  };
});

server.tool(
  "recorder_errors",
  "searches test proxy logs for recorder mismatch",
  { directory: z.string() },
  ({ directory }) => {
    let logs = readFileSync(
      "/home/maorleger/workspace/azure-sdk-for-js/sdk/keyvault/keyvault-admin/testProxyOutput.log",
      "utf-8",
    );

    // if (directory === "/home/maorleger/workspace/azure-sdk-for-js") {
    //   logs = readFileSync(
    //     `${directory}/sdk/keyvault/keyvault-admin/testProxyOutput.log`, // of course we'd want to parameterize this
    //     "utf-8",
    //   );
    // } else {
    //   // we're already in the directory we ran the command from
    //   logs = readFileSync(
    //     `${directory}/testProxyOutput.log`, // of course we'd want to parameterize this
    //     "utf-8",
    //   );
    // }
    const mismatchRegex =
      /^\[\d{2}:\d{2}:\d{2}\] fail: Azure\.Sdk\.Tools\.TestProxy\[0\]\s+Unable to find a record for the request .+?(?:\n\s+.+?)+/gm;
    // find all text that matches the regex in the file, and it would be multiple lines
    const matches = [...logs.matchAll(mismatchRegex)];

    const sanitizerInfo = parseLogFile(logs);
    return {
      content: [
        {
          type: "text",
          text: matches.join("\n"),
        },
        {
          type: "text",
          text: JSON.stringify(sanitizerInfo),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure MCP server started");
}

main().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
