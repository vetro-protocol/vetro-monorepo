import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    // "hidden" generates source maps for Sentry but strips sourceMappingURL
    // from the output so browsers can't discover them. "true" also serves them
    // publicly.
    sourcemap: process.env.DEPLOY_ENV === "production" ? "hidden" : true,
  },
  plugins: [
    react(),
    cloudflare(),
    nodePolyfills({
      include: ["http", "https"],
    }),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "hemi-labs",
      project: "vetro-app",
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
