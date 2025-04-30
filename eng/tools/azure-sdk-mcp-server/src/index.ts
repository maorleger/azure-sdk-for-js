import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { helloWorldSchema } from "./schema";

// Create an MCP server
const server = new McpServer({
  name: "Azure SDK Support",
  version: "0.1.0",
});

// Register a tool
server.tool(
  "hello_world",
  "Prints hello world",
  helloWorldSchema.shape,
  async ({ workspaceRoot }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello world! from ${workspaceRoot}`,
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
