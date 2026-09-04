import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": `${import.meta.dirname}/tests/server-only.ts`,
      "next-view-transitions": `${import.meta.dirname}/tests/mocks/next-view-transitions.tsx`,
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
