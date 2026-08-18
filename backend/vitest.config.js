import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.js"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.js"],
          // These tests share one real Postgres DB and call resetDb() (which
          // truncates every table) in beforeEach/afterEach. Running test files
          // in parallel would race each other's inserts/deletes against the
          // same tables, so force everything onto a single worker/file at a time.
          fileParallelism: false,
          pool: "forks",
          singleFork: true,
          testTimeout: 20000,
        },
      },
    ],
  },
});
