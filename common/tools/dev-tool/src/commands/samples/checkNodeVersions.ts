// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from "fs-extra";
import path from "path";
import pr from "child_process";
import os from "os";

import { createPrinter } from "../../util/printer";
import { leafCommand, makeCommandInfo } from "../../framework/command";
import { resolveProject } from "../../util/resolveProject";

const log = createPrinter("check-node-versions-samples");

async function spawnCMD(cmd: string, args?: string[], errorMessage?: string): Promise<void> {
  const spawnedProcess = pr.spawn(cmd, args);
  await new Promise((resolve, reject) => {
    spawnedProcess.on("exit", resolve);
    spawnedProcess.on("error", (err: Error) => {
      log.info(errorMessage);
      reject(err);
    });
  });
}

async function deleteDockerContainers(deleteContainerNames?: string[]): Promise<void> {
  if (deleteContainerNames) {
    log.info(`Cleanup: deleting ${deleteContainerNames.join(", ")} docker containers`);
    await spawnCMD(
      "docker",
      ["rm", ...deleteContainerNames, "-f"],
      `Attempted to delete ${deleteContainerNames.join(
        ", "
      )} docker containers but encountered an error doing so`
    );
  }
}

async function deleteDockerImages(dockerImageNames?: string[]) {
  if (dockerImageNames) {
    log.info(`Cleanup: deleting ${dockerImageNames.join(", ")} docker images`);
    await spawnCMD(
      "docker",
      ["rmi", ...dockerImageNames, "-f"],
      `Attempted to delete the ${dockerImageNames.join(
        ", "
      )} docker images but encountered an error doing so`
    );
  }
}

async function deleteDockerContext(dockerContextDirectory?: string) {
  if (dockerContextDirectory) {
    log.info(`Cleanup: deleting the ${dockerContextDirectory} docker context directory`);
    await spawnCMD("rm", ["-rf", dockerContextDirectory], undefined);
  }
}

async function cleanup(
  dockerContextDirectory?: string,
  dockerContainerNames?: string[],
  dockerImageNames?: string[]
) {
  await deleteDockerContext(dockerContextDirectory);
  await deleteDockerContainers(dockerContainerNames);
  await deleteDockerImages(dockerImageNames);
}

function createDockerContextDirectory(
  dockerContextDirectory: string,
  samplesPath: string,
  envPath: string,
  artifactPath?: string
): void {
  if (artifactPath === undefined) {
    throw new Error("artifact_path is a required argument but it was not passed");
  } else if (!fs.existsSync(artifactPath)) {
    throw new Error(`artifact path passed does not exist: ${artifactPath}`);
  }
  const artifactName = path.basename(artifactPath);
  const envFileName = path.basename(envPath);
  fs.copySync(samplesPath, path.join(dockerContextDirectory, "samples"));
  fs.copyFileSync(artifactPath, path.join(dockerContextDirectory, artifactName));
  fs.copyFileSync(envPath, path.join(dockerContextDirectory, envFileName));
  fs.copyFileSync(
    path.join(__dirname, "Dockerfile"),
    path.join(dockerContextDirectory, "Dockerfile")
  );
  fs.copyFileSync(
    path.join(__dirname, "run_samples.sh"),
    path.join(dockerContextDirectory, "run_samples.sh")
  );
}

async function runDockerContainer(
  dockerContextDirectory: string,
  version: string,
  artifactName: string
): Promise<void> {
  console.log("dockerContextDirectory", dockerContextDirectory);
  const dockerImageName = `check-node-versions-${version}:latest`;

  log.info(`Creating image ${dockerImageName}`);
  let childProcess = pr.spawn(
    "docker",
    [
      "build",
      ".",
      "--build-arg",
      `NODE_VERSION=${version}`,
      "--build-arg",
      `ARTIFACT_PATH=./${artifactName}`,
      "--tag",
      dockerImageName
    ],
    {
      cwd: dockerContextDirectory
    }
  );
  await new Promise((resolve, reject) => {
    childProcess.stdout.on("data", (data) => console.log(data.toString()));
    childProcess.stderr.on("data", (data) => console.log(data.toString()));
    childProcess.on("exit", resolve);
    childProcess.on("error", reject);
  });

  if (childProcess.exitCode !== 0) {
    throw new Error(`Failed to build image ${dockerImageName}`);
  }

  log.info(`Running samples on ${dockerImageName}`);
  childProcess = pr.spawn("docker", ["run", dockerImageName], {
    cwd: dockerContextDirectory
  });

  await new Promise((resolve, reject) => {
    childProcess.stdout.on("data", (data) => console.log(data.toString()));
    childProcess.stderr.on("data", (data) => console.log(data.toString()));
    childProcess.on("exit", resolve);
    childProcess.on("error", reject);
  });

  if (childProcess.exitCode !== 0) {
    throw new Error(`Failed to run samples on ${dockerImageName}`);
  }
}

export const commandInfo = makeCommandInfo(
  "check-node-versions",
  "execute samples with different node versions, typically in preparation for release",
  {
    "artifact-path": {
      kind: "string",
      description: "Path to the downloaded artifact built by the release pipeline"
    },
    directory: {
      kind: "string",
      description: "Base dir, default is process.cwd()",
      default: process.cwd()
    },
    "node-versions": {
      kind: "string",
      description: "A comma separated list of node versions to use",
      default: "8,10,12"
    },
    "context-directory-path": {
      kind: "string",
      description: "Absolute path to a directory used for mounting inside docker containers",
      default: ""
    },
    "keep-docker-context": {
      kind: "boolean",
      description: "Boolean to indicate whether to keep the current docker context directory",
      default: false
    },
    "log-in-file": {
      kind: "boolean",
      description:
        "Boolean to indicate whether to save the the stdout and sterr for npm commands to the log.txt log file",
      default: true
    },
    "use-existing-docker-containers": {
      kind: "boolean",
      description: "Boolean to indicate whether to use existing docker containers if any",
      default: false
    },
    "keep-docker-containers": {
      kind: "boolean",
      description: "Boolean to indicate whether to keep docker containers",
      default: false
    },
    "keep-docker-images": {
      kind: "boolean",
      description: "Boolean to indicate whether to keep the downloaded docker images",
      default: false
    }
  }
);

export default leafCommand(commandInfo, async (options) => {
  const nodeVersions = options["node-versions"]?.split(",");
  const dockerContextDirectory: string =
    options["context-directory-path"] === ""
      ? await fs.mkdtemp(path.join(os.tmpdir(), "context"))
      : options["context-directory-path"];
  const pkg = await resolveProject(options.directory);
  const samplesPath = path.join(pkg.path, "samples");
  const envFilePath = path.join(pkg.path, ".env");
  const keepDockerContextDirectory = options["keep-docker-context"];
  const dockerImageNames = nodeVersions.map((version: string) => `node:${version}-alpine`);
  const dockerContainerNames = nodeVersions.map((version: string) => `${version}-container`);
  const useExistingDockerContainer = options["use-existing-docker-containers"];
  const keepDockerContainers = options["keep-docker-containers"];
  const keepDockerImages = options["keep-docker-images"];
  async function cleanupBefore(): Promise<void> {
    const dockerContextDirectoryChildren = await fs.readdir(dockerContextDirectory);
    await cleanup(
      // If the directory is empty, we will not delete it.
      dockerContextDirectoryChildren.length === 0 ? undefined : dockerContextDirectory,
      useExistingDockerContainer ? undefined : dockerContainerNames,
      // Do not delete the image
      undefined
    );
  }
  async function cleanupAfter(): Promise<void> {
    await cleanup(
      keepDockerContextDirectory ? undefined : dockerContextDirectory,
      keepDockerContainers ? undefined : dockerContainerNames,
      keepDockerImages ? undefined : dockerImageNames
    );
  }
  function createDockerContextDirectoryThunk(): void {
    createDockerContextDirectory(
      dockerContextDirectory,
      samplesPath,
      envFilePath,
      options["artifact-path"]
    );
  }
  async function runContainers(): Promise<void> {
    const containerRuns = nodeVersions.map((version) => () =>
      runDockerContainer(dockerContextDirectory, version, path.basename(options["artifact-path"]!))
    );
    for (const run of containerRuns) {
      await run();
    }
  }
  await cleanupBefore();
  createDockerContextDirectoryThunk();
  await runContainers();
  await cleanupAfter();

  return true;
});
