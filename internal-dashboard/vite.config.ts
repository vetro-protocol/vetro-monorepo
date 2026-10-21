import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const config = {
  plugins: [
    react(),
    cloudflare(),
    // fetch-plus-plus creates an http.Agent for http:// URLs, such as a local
    // VITE_VETRO_API_URL.
    nodePolyfills({
      include: ["http", "https"],
    }),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5175,
  },
} satisfies UserConfig;

export default defineConfig(config);
