import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const helloWorldSchema = z.object({
  workspaceRoot: z.string(),
});

export type HelloWorldSchema = z.infer<typeof helloWorldSchema>;

export async function helloWorld(args: HelloWorldSchema): Promise<CallToolResult> {
  return {
    content: [
      {
        type: "text",
        text: "Hello world!",
      },
      {
        type: "text",
        text: `Workspace root: ${args.workspaceRoot}`,
      },
    ],
  };
}
