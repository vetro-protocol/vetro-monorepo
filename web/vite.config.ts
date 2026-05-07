import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

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
    tsconfigPaths(),
  ],
};

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
