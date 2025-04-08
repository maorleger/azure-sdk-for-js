import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import "zx/globals";
import { prepareRelease, schema } from "./commands/prepare-release/index.js";

// Create an MCP server
const server = new McpServer({
  name: "Azure SDK Support",
  version: "1.0.0",
});

server.tool(
  "prepare_release",
  "populates the changelog with any missing entries, then runs the prepare-release script. Finally, it will create a pull request with the changes in draft mode",
  schema.shape,
  async (schema) => {
    const packageJsonPath = path.join(
      schema.workspaceRoot,
      schema.packageDirectory,
      "package.json",
    );
    const packageJsonContents = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContents);

    return prepareRelease({
      ...schema,
      packageName: packageJson.name,
      packageVersion: packageJson.version,
    });
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
