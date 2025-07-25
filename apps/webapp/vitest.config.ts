import { defineConfig } from 'vitest/config'
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  })