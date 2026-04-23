import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths()],
  envDir: "../",
  test: {
    environment: "jsdom",
    reporters: ["default", "hanging-process"],
    setupFiles: ["/tests/setup.ts"],
    env: {
      NODE_OPTIONS: "--no-experimental-webstorage",
    },
  },
});
