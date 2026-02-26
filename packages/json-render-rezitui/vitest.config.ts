import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "zod": path.resolve(__dirname, "node_modules/@json-render/core/node_modules/zod"),
    },
  },
});
