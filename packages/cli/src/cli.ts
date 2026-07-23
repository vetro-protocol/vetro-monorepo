#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { register as swap } from "./features/swap/index.js";
import { printError } from "./lib/output.js";

const packageJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "package.json",
);
const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  bin: Record<string, string>;
  description: string;
  version: string;
};

const program = new Command();

program
  // The CLI name is the bin key (vetro-cli), not the scoped package name.
  .name(Object.keys(pkg.bin)[0])
  .description(pkg.description)
  .version(pkg.version);

const features = [swap];

features.forEach((register) => register(program));

program.parseAsync(process.argv).catch(printError);
