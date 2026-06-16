import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";

const config = {
  plugins: [react(), cloudflare(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5175,
  },
} satisfies UserConfig;

export default defineConfig(config);
