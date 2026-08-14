// Shared by scripts/bundle-package.js and packages/cli/esbuild.js.
import { readFileSync } from "node:fs";

const isPrivateWorkspacePackage = function (name) {
  try {
    return (
      JSON.parse(readFileSync(`./node_modules/${name}/package.json`, "utf8"))
        .private === true
    );
  } catch {
    return false;
  }
};

// Whatever is declared stays "external" - kept as a runtime import, not
// bundled. Private workspaces are inlined instead, and the guard below is what
// keeps them out of here.
export function getExternalDependencies(packageJson) {
  const declaredDependencies = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
  });

  // Private workspaces are only allowed in devDependencies.
  const misplaced = declaredDependencies.filter(isPrivateWorkspacePackage);
  if (misplaced.length > 0) {
    throw new Error(
      `${misplaced.join(", ")}: private workspaces get inlined, so they must be devDependencies -- declaring them as runtime or peer dependencies publishes a package npm cannot install.`,
    );
  }

  return declaredDependencies.flatMap((name) => [name, `${name}/*`]);
}
