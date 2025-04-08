import "zx/globals";
import { readFile } from "node:fs/promises";
import { z } from "zod";

export const schema = z.object({
  packageDirectory: z.string(),
  workspaceRoot: z.string(),
  releaseDate: z.optional(z.string()),
  packageVersion: z.optional(z.string()),
  packageName: z.optional(z.string()),
});

type Schema = z.infer<typeof schema>;

interface ChangelogEntry {
  featuresAdded: string[];
  breakingChanges: string[];
  bugsFixed: string[];
  otherChanges: string[];
}

export async function prepareRelease(schema: Schema): Promise<{
  content: { type: "text"; text: string }[];
}> {
  await runPrepareReleaseScript(schema);
  const changelogEntries = await getChangelogRecommendations(schema);
  return {
    content: [
      {
        type: "text",
        text: "The prepare-release script was run successfully. Compare the changelogEntries.entries field with the commits in changelogEntries.commits and suggest any missing changelog entries to the user",
      },
      {
        type: "text",
        text: JSON.stringify(changelogEntries),
      },
    ],
  };
}

/**
 * Runs the prepare-release PowerShell script for a given package name
 * @param workspaceRoot - The root directory of the workspace
 * @param packageName - The name of the package to prepare for release
 * @returns The stdout and stderr from the script execution
 */
export async function runPrepareReleaseScript(
  schema: Schema,
): Promise<{ stdout: string; stderr: string }> {
  const args = [`-PackageName ${schema.packageName}`];
  if (schema.releaseDate) {
    args.push(`-ReleaseDate ${schema.releaseDate}`);
  }

  console.log("Running prepare-release script with args:", args);

  const processPromise = $({
    cwd: schema.workspaceRoot,
    shell: "pwsh",
    verbose: true,
    prefix: "",
    quote: (arg) => arg, // TODO: fix quoting
  })`./eng/common/scripts/Prepare-Release.ps1 ${args}`;

  processPromise.stdin.write("\n");
  processPromise.stdin.end();

  const { stdout, stderr } = await processPromise;
  if (stderr) {
    console.error("Error running prepare-release script:", stderr);
  }

  return { stdout, stderr };
}

export async function getChangelogRecommendations(
  schema: Schema,
): Promise<{ entries: ChangelogEntry; commits: string[] }> {
  const changelogPath = path.join(
    schema.workspaceRoot ?? "",
    schema.packageDirectory ?? "",
    "CHANGELOG.md",
  );
  const content = await readFile(changelogPath, "utf-8");
  const lines = content.split("\n");

  const entries: ChangelogEntry = {
    featuresAdded: [],
    breakingChanges: [],
    bugsFixed: [],
    otherChanges: [],
  };

  let currentSection: keyof ChangelogEntry = "otherChanges";
  let isInUnreleasedSection = false;

  for (const line of lines) {
    if (line.includes(`## ${schema.packageVersion}`)) {
      isInUnreleasedSection = true;
      continue;
    }

    if (line.startsWith("## ") && isInUnreleasedSection) {
      break;
    }

    if (isInUnreleasedSection) {
      if (line.startsWith("### Features Added")) {
        currentSection = "featuresAdded";
      } else if (line.startsWith("### Breaking Changes")) {
        currentSection = "breakingChanges";
      } else if (line.startsWith("### Bugs Fixed")) {
        currentSection = "bugsFixed";
      } else if (line.startsWith("### Other Changes")) {
        currentSection = "otherChanges";
      } else if (line.trim() && currentSection && !line.startsWith("#")) {
        entries[currentSection].push(line.trim());
      }
    }
  }

  const commits = await getCommitsSinceLastRelease(schema, content);

  return {
    entries: entries,
    commits: commits,
  };
}

export async function getCommitsSinceLastRelease(
  schema: Schema,
  changelogContent: string,
): Promise<string[]> {
  const versionPattern = /## (\d+\.\d+\.\d+(?:-beta\.\d+)?)\s+\([^)]+\)/g;
  const matches = [...changelogContent.matchAll(versionPattern)];
  const previousVersion = matches[1]?.[1];
  if (!previousVersion) {
    throw new Error("No previous version found in changelog");
  }

  const { stdout } = await $({
    cwd: schema.workspaceRoot,
  })`git log ${schema.packageName}_${previousVersion}..HEAD --pretty=format:"%s" -- ${schema.packageDirectory}`;

  return stdout.split("\n").filter(Boolean);
}
