# Internal Dashboard

Internal-facing dashboard for tracking various operational metrics. Each metric area
lives on its own tab, mapped to a URL.

- **DEX** (`/dex`) — liquidity of the tracked Vetro pools on Curve, Sushi and
  Uniswap. Each pool also has a detail view at `/dex/:poolId`.
- **Hemi Earn** (`/hemi-earn`) — status of the Hemi Earn agent: keepers,
  ownership, proxy implementation and its pending vault cooldowns.

`/` and unknown paths redirect to the DEX tab.

It's a Vite + React + TypeScript + Tailwind v4 SPA, deployed to Cloudflare via a Worker
that serves the static assets and injects security headers (see `src/index.ts`).

## Environment Variables

Set these in `internal-dashboard/.env` (or a `.env.local` override) before you run `dev` or `build`.

| Variable               | Required | Description                                                                                                                                                          |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_PORTAL_API_URL`  | Yes      | Hemi Portal API base URL (used for token prices).                                                                                                                    |
| `VITE_RPC_URL_MAINNET` | Yes      | RPC URL(s) for Ethereum mainnet. Several URLs joined by `+` become a fallback transport. Baked into the client bundle at build time, thus readable by every visitor. |

The Worker builds its `connect-src` CSP directive from the same two variables (see `src/index.ts`), so an override is allowed by the CSP without more changes.

## Development

```sh
pnpm dev      # start the Vite dev server
pnpm build    # typecheck + production build
pnpm preview  # preview the production build
pnpm tsc      # typecheck only
```

## Deployment

Deployed to Cloudflare with `wrangler` (see `wrangler.jsonc`).
