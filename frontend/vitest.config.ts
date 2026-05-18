import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "react-quilljs": fileURLToPath(
        new URL("./tests/mocks/react-quilljs.mock.ts", import.meta.url)
      ),
    },
  },
  envDir: "../",
  test: {
    environment: "jsdom",
    reporters: ["default", "hanging-process"],
    setupFiles: ["/tests/setup.ts"],
    env: {
      NODE_OPTIONS: "--no-experimental-webstorage",
    },
    fileParallelism: true,
  },
});
