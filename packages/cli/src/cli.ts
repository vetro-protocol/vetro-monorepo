#!/usr/bin/env node
import { type GlobalOptions } from "./lib/client.ts";
import { printError } from "./lib/output.ts";
import { createProgram } from "./program.ts";

const program = createProgram();

program
  .parseAsync(process.argv)
  .catch((error: unknown) =>
    printError({ error, rpcUrl: program.opts<GlobalOptions>().rpcUrl }),
  );
