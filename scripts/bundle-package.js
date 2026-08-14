// Use this script to bundle packages from packages/* into npm
import { build } from "esbuild";
import { readFileSync } from "node:fs";

import { getExternalDependencies } from "./package-externals.js";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

const entryPoints = Object.values(packageJson.exports)
  .map((entry) => (typeof entry === "string" ? entry : entry.default))
  .filter((target) => target.endsWith(".ts"));

await build({
  bundle: true,
  entryPoints,
  external: getExternalDependencies(packageJson),
  format: "esm",
  outbase: "src",
  outdir: "_esm",
  platform: "neutral",
  sourcemap: true,
  splitting: true,
});
