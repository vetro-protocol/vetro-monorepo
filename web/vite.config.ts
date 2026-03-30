import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    sourcemap: true,
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
});
