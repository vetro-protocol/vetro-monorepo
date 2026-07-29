import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/e2e/setup.ts"],
    hookTimeout: 60_000,
    include: ["test/e2e/**/*.test.ts"],
    testTimeout: 60_000,
  },
});
