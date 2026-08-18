import { defineConfig, mergeConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      css: true,
      setupFiles: "./src/test/setup.ts",
      // frontend/e2e/**/*.spec.ts are Playwright specs (playwright.config.ts's
      // own testDir) — they call @playwright/test's test(), not Vitest's, and
      // would otherwise get picked up by Vitest's default *.spec.ts glob too.
      exclude: [ ...configDefaults.exclude, "e2e/**" ],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/test/**", "src/**/*.d.ts"],
      },
    },
  })
);