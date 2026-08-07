// Use this script to bundle packages from packages/* into npm
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const readPackageJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const packageJson = readPackageJson("./package.json");

const entryPoints = Object.values(packageJson.exports)
  .map((entry) => (typeof entry === "string" ? entry : entry.default))
  .filter((target) => target.endsWith(".ts"));

const isPrivateWorkspacePackage = function (name) {
  try {
    return (
      readPackageJson(`./node_modules/${name}/package.json`).private === true
    );
  } catch {
    return false;
  }
};

const declaredDependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
});

// Private workspaces are only allowed in devDependencies.
const misplaced = declaredDependencies.filter(isPrivateWorkspacePackage);
if (misplaced.length > 0) {
  throw new Error(
    `${misplaced.join(", ")} is private and gets inlined, so it must be a devDependency -- declaring it as a runtime or peer dependency publishes a package npm cannot install.`,
  );
}

// Whatever is declared stays "external" - kept as a runtime import, not
// bundled. Private workspaces are inlined instead, and the guard above is what
// keeps them out of here.
const external = declaredDependencies.flatMap((name) => [name, `${name}/*`]);

await build({
  bundle: true,
  entryPoints,
  external,
  format: "esm",
  outbase: "src",
  outdir: "_esm",
  platform: "neutral",
  sourcemap: true,
  splitting: true,
});
