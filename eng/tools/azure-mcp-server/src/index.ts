import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import { z } from "zod";
import { parseLogFile } from "./recorder.js";

// Create an MCP server
const server = new McpServer({
  name: "Azure SDK Support",
  version: "1.0.0",
});

server.tool(
  "recorder_errors",
  "searches test proxy logs for recorder mismatch",
  { directory: z.string() },
  ({ directory }) => {
    let logs;
    if (directory === "/home/maorleger/workspace/azure-sdk-for-js") {
      logs = readFileSync(
        `${directory}/sdk/keyvault/keyvault-admin/testProxyOutput.log`, // of course we'd want to parameterize this
        "utf-8",
      );
    } else {
      // we're already in the directory we ran the command from
      logs = readFileSync(
        `${directory}/testProxyOutput.log`, // of course we'd want to parameterize this
        "utf-8",
      );
    }
    const mismatchRegex =
      /^\[\d{2}:\d{2}:\d{2}\] fail: Azure\.Sdk\.Tools\.TestProxy\[0\]\s+Unable to find a record for the request .+?(?:\n\s+.+?)+/gm;
    // find all text that matches the regex in the file, and it would be multiple lines
    const matches = [...logs.matchAll(mismatchRegex)];
    console.log("matches", matches);

    const sanitizerInfo = parseLogFile(logs);
    // console.error(sanitizerInfo);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(sanitizerInfo),
        },
      ],
    };
    return {
      content: [
        {
          type: "text",
          text: matches,
        },
        {
          type: "text",
          text: JSON.stringify([...sanitizerInfo].join("\n"), null, 2),
        },
      ],
    };
  },
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  }),
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
