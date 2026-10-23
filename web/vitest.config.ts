import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    projects: [
      {
        extends: true,
        test: {
          include: ["**/*.test.ts"],
          name: "unit",
        },
      },
      {
        extends: true,
        plugins: [
          react(),
          nodePolyfills({
            include: ["http", "https"],
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
          include: ["test/**/*.test.tsx"],
          name: "integration",
          setupFiles: ["test/components/setup.ts"],
        },
      },
    ],
  },
});
