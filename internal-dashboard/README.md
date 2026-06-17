# Internal Dashboard

Internal-facing dashboard for tracking various operational metrics. Each metric area
lives on its own tab, mapped to a URL.

- **Curve** (`/curve`) — liquidity on Curve pools _(placeholder for now)_.

It's a Vite + React + TypeScript + Tailwind v4 SPA, deployed to Cloudflare via a Worker
that serves the static assets and injects security headers (see `src/index.ts`).

## Development

```sh
pnpm dev      # start the Vite dev server
pnpm build    # typecheck + production build
pnpm preview  # preview the production build
pnpm tsc      # typecheck only
```

## Deployment

Deployed to Cloudflare with `wrangler` (see `wrangler.jsonc`). The `staging` and
`production` environments map to the `vetro-internal-dashboard-staging` and
`vetro-internal-dashboard` Workers respectively.
