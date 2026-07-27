import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin, type UserConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

function injectUmamiIfEnabled() {
  let env: Record<string, string> = {};
  return {
    configResolved(config) {
      env = config.env;
    },
    name: "umami-analytics",
    transformIndexHtml: {
      handler(html) {
        const src = env.VITE_ANALYTICS_URL;
        const websiteId = env.VITE_ANALYTICS_WEBSITE_ID;
        if (!src || !websiteId) {
          return html;
        }
        return {
          html,
          tags: [
            {
              attrs: {
                "data-auto-track": "false",
                "data-website-id": websiteId,
                defer: true,
                src,
              },
              injectTo: "head",
              tag: "script",
            },
          ],
        };
      },
      order: "post",
    },
  } satisfies Plugin;
}

const config = {
  build: {
    // "hidden" generates source maps for Sentry but strips sourceMappingURL
    // from the output so browsers can't discover them. "true" also serves them
    // publicly.
    sourcemap:
      process.env.VITE_DEPLOY_ENV === "production" ? ("hidden" as const) : true,
  },
  plugins: [
    react(),
    cloudflare(),
    nodePolyfills({
      include: ["http", "https"],
    }),
    tailwindcss(),
    injectUmamiIfEnabled(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
} satisfies UserConfig;

if (process.env.VITE_DEPLOY_ENV) {
  // Sentry plugin shall be last to ensure source maps are generated correctly
  // and tree-shaking doesn't remove Sentry's instrumentation.
  config.plugins.push(
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "hemi-labs",
      project: "vetro-app",
      release: {
        deploy: {
          env: process.env.VITE_DEPLOY_ENV,
        },
      },
      telemetry: false,
    }),
  );
}

export default defineConfig(config);
