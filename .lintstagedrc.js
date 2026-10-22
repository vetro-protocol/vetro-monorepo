import path from "node:path";

export default {
  "!(.github/workflows/*.yml|*.{js,md,ts,tsx}|api/wrangler.jsonc|package.json)":
    ["prettier --ignore-unknown --write"],
  "*.{js,md,ts,tsx}": [
    function (files) {
      const linted = files.filter(
        (file) =>
          !path.relative(import.meta.dirname, file).startsWith("subgraph/"),
      );
      return linted.length
        ? [
            `eslint --cache --fix --max-warnings 0 ${linted.map((file) => `"${file}"`).join(" ")}`,
          ]
        : [];
    },
    "prettier --write",
  ],
  ".github/workflows/*.yml": ["better-sort-github-actions", "prettier --write"],
  "api/wrangler.jsonc": [
    () => "pnpm --filter api run types",
    "git add api/worker-configuration.d.ts",
    "prettier --write",
  ],
  "package.json": ["better-sort-package-json", "prettier --write"],
};
