#!/usr/bin/env node

// read the file packages.txt in the same directory
var fs = require("fs");
var path = require("path");
var file = path.join(__dirname, "packages.txt");
var data = fs.readFileSync(file, "utf8");
var execSync = require("child_process").execSync;
var failedPackages = [];
// Helper to execute shell commands and log output
function execCommand(command, packageName) {
  console.log(`${packageName}: Running command: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`${packageName}: Command succeeded: ${command}`);
  } catch (error) {
    console.error(`${packageName}: Command failed: ${command}`);
    failedPackages.push(packageName);
  }
}
// split the file into an array of lines
var lines = data.split("\n");

// leave only the first 5 lines in lines array
// lines = lines.slice(0, 5);

// for each line, run the following command from the current repo: rush build -t <line> --verbose -p max && rush test --only <line> --verbose
lines.forEach(function (line) {
  var command = `rush test --only ${line} --verbose`;
  execCommand(command, line);
});

if (failedPackages.length > 0) {
  console.log(`The following packages failed:\n\n${failedPackages.join("\n")}`);
}
