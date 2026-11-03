export default {
  "!(.github/workflows/*.yml|*.{js,md,ts,tsx}|api/wrangler.jsonc|package.json)":
    ["prettier --ignore-unknown --write"],
  "*.{js,md,ts,tsx}": [
    "eslint --cache --fix --max-warnings 0",
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
