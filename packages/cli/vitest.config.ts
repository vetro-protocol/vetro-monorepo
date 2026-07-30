import {
  configDefaults,
  coverageConfigDefaults,
  defineConfig,
} from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, "test/**"],
    },
    projects: [
      {
        test: {
          clearMocks: true,
          exclude: [...configDefaults.exclude, "test/e2e/**"],
          name: "unit",
          restoreMocks: true,
        },
      },
      {
        test: {
          fileParallelism: false,
          globalSetup: ["./test/e2e/setup.ts"],
          hookTimeout: 60_000,
          include: ["test/e2e/**/*.test.ts"],
          name: "e2e",
          testTimeout: 60_000,
        },
      },
    ],
  },
});
