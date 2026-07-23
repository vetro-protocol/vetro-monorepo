import { build } from "esbuild";

await build({
  // Provide a real `require` so bundled CommonJS deps (commander) work in ESM output.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  bundle: true,
  entryPoints: ["src/cli.ts"],
  format: "esm",
  outfile: "_esm/cli.js",
  platform: "node",
});
