# Landing

Static waitlist landing page served via Cloudflare Workers.

## Development

```sh
pnpm dev        # starts wrangler dev server (serves static files + API)
pnpm dev:css    # watches for CSS changes and rebuilds (run in a separate terminal)
```

## CSS build

Tailwind CSS is pre-compiled using the Tailwind CLI to avoid runtime dependencies and simplify deployment. The compiled file (`public/style.css`) is committed to the repository.

If you modify `src/index.css` or change any Tailwind classes in `public/index.html`, you must rebuild and commit the output:

```sh
pnpm build:css  # compiles src/index.css -> public/style.css
```
