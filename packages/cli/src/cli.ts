#!/usr/bin/env node
import { type GlobalOptions } from "./lib/client.js";
import { printError } from "./lib/output.js";
import { createProgram } from "./program.js";

const program = createProgram();

program
  .parseAsync(process.argv)
  .catch((error: unknown) =>
    printError({ error, rpcUrl: program.opts<GlobalOptions>().rpcUrl }),
  );
