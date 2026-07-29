import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    exclude: [...configDefaults.exclude, "test/e2e/**"],
    restoreMocks: true,
  },
});
