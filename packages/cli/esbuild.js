import { build } from "esbuild";
import { readFileSync } from "node:fs";

import { getExternalDependencies } from "../../scripts/package-externals.js";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

await build({
  bundle: true,
  entryPoints: ["src/cli.ts"],
  external: getExternalDependencies(packageJson),
  format: "esm",
  outfile: "_esm/cli.js",
  platform: "node",
  sourcemap: true,
});
