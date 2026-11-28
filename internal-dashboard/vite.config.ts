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
    proxy: {
      "/vetro-api": {
        changeOrigin: true,
        configure: (proxy) =>
          proxy.on("proxyReq", (proxyReq) =>
            proxyReq.removeHeader("cf-connecting-ip"),
          ),
        rewrite: (path) => path.replace(/^\/vetro-api/, ""),
        target: "https://vetro-api.letshamsterdance.xyz",
      },
    },
  },
} satisfies UserConfig;

export default defineConfig(config);
