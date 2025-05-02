import { startServer } from "../../azure-sdk-mcp-server";
import { leafCommand, makeCommandInfo } from "../../framework/command";
import { createPrinter } from "../../util/printer";

const log = createPrinter("mcp");

export const commandInfo = makeCommandInfo("start-mcp-server", "runs the MCP server", {});

export default leafCommand(commandInfo, async () => {
  log.info("Starting MCP server...");
  await startServer();
  log.info("MCP server started.");
  return true;
});
