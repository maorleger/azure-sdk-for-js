// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from "node:path";
import { leafCommand, makeCommandInfo } from "../../framework/command.ts";
import { writeApiReview } from "../../util/apiReview.ts";
import { createPrinter } from "../../util/printer.ts";

const log = createPrinter("generate-api-review");

export const commandInfo = makeCommandInfo(
  "generate-api-review",
  "Prototype: generate an ESM public-surface review with runtime differences.",
  {
    "package-root": {
      kind: "string",
      description: "Directory containing package.json and its built declaration files.",
    },
    "output-dir": {
      kind: "string",
      description: "Artifact directory for api.md and api.metadata.yml (required).",
    },
  },
);

export default leafCommand(commandInfo, async (options) => {
  if (!options["output-dir"] || options.args.length > 0) {
    log.error("Use --output-dir <directory> and optionally --package-root <directory>.");
    return false;
  }
  try {
    const output = path.resolve(options["output-dir"]);
    const review = writeApiReview(path.resolve(options["package-root"] ?? process.cwd()), output);
    log.info(
      `Generated ${review.entryCount} entry points, ${review.declarationCount} exported and ${review.helperCount} reachable declarations (${review.profiles.join(", ")}) in ${output}.`,
    );
    log.info(`apiMdSha256: ${review.apiMdSha256}`);
    return true;
  } catch (error: unknown) {
    log.error(error instanceof Error ? error.message : String(error));
    return false;
  }
});
