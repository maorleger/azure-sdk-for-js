import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { helloWorldSchema, helloWorld } from "./tools/helloWorld.js";
import { commandInfoSchema, commandInfoTool } from "./tools/devTool.js";

const server = new McpServer({
  name: "Azure SDK MCP Server",
  version: "0.1.0",
});

// Register a tool
server.tool("hello_world", "Prints hello world", helloWorldSchema.shape, (args) =>
  helloWorld(args),
);

server.tool(
  "dev_tool_commands",
  "Lists all dev-tool commands that are available, as well as their description.",
  commandInfoSchema.shape,
  (args) => commandInfoTool(args),
);

export async function startServer() {
  const transport = new StdioServerTransport();
  return server.connect(transport);
}

async function main() {
  await startServer();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
  });
}
