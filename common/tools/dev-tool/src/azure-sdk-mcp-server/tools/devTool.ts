import { z } from "zod";
import { baseCommand, baseCommandInfo, baseCommands } from "../../commands";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { CommandLoader } from "../../framework/CommandModule";
import { CommandInfo } from "../../framework/CommandInfo";

export const commandInfoSchema = z.object({
  baseCommand: z.optional(z.string()),
});

export type CommandInfoSchema = z.infer<typeof commandInfoSchema>;

export async function commandInfoTool(args: CommandInfoSchema): Promise<CallToolResult> {
  // first find the command that we're asking about
  // const commands = [];
  // if (args.baseCommand === undefined) {
  //   for (const command of Object.values(baseCommands)) {
  //     const info = (await command()).commandInfo;
  //     commands.push(info);
  //   }
  // } else {
  //   // find the command that matches the baseCommand
  //   const command = (baseCommands as any)[args.baseCommand];
  //   if (command === undefined) {
  //     throw new Error(`Command ${args.baseCommand} not found`);
  //   }
  //   const info = (await command()).commandInfo;
  //   commands.push(info);
  // }
  let path: string[];
  if (args.baseCommand) {
    path = args.baseCommand.split(" ");
  } else {
    path = [];
  }
  const commands = await getCommandInfo(path, baseCommands);

  return {
    content: [
      {
        text: JSON.stringify(commands),
        type: "text",
      },
    ],
  };
}

export async function getCommandInfo(
  commandPath: string[],
  commands: CommandLoader = baseCommands,
): Promise<CommandInfo<unknown>[]> {
  let command: CommandLoader[string] | undefined = undefined;
  while (commandPath.length > 0) {
    const [commandName, ...rest] = commandPath;
    command = commands[commandName];
    if (command === undefined) {
      throw new Error(`Command ${commandName} not found`);
    }
    commandPath = rest;
  }
  if (command === undefined) {
    throw new Error(`Command ${commandPath.join(" ")} not found`);
  }
  const commandModule = await command();
  const result = [];
  const info = commandModule.commandInfo;
  result.push(info);
  if ("default" in commandModule && commandModule.default.name === "subCommand") {
    const subCommands = (await commandModule.default()) as unknown as CommandLoader;
    for (const c of Object.values(subCommands)) {
      const info = (await c()).commandInfo;
      result.push(info);
    }
  }

  return result;
}
