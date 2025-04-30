import { z } from "zod";

export const helloWorldSchema = z.object({
  workspaceRoot: z.string(),
});

export type HelloWorldSchema = z.infer<typeof helloWorldSchema>;
