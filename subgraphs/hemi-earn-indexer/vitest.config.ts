import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    hookTimeout: 15_000,
    pool: "forks",
    testTimeout: 15_000,
  },
});
