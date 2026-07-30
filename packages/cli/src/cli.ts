#!/usr/bin/env node
import { printError } from "./lib/output.js";
import { createProgram } from "./program.js";

createProgram().parseAsync(process.argv).catch(printError);
