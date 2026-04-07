# Landing

Static waitlist landing page served via Cloudflare Workers.

## Development

```sh
pnpm dev        # starts wrangler dev server (serves static files + API)
pnpm dev:css    # watches for CSS changes and rebuilds (run in a separate terminal)
```

## CSS build

Tailwind CSS is pre-compiled using the Tailwind CLI. The compiled output (`public/style.css`) is gitignored and built during deployment.

```sh
pnpm build:css  # compiles src/index.css -> public/style.css
```
