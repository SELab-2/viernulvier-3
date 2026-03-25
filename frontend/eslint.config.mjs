// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import react from "eslint-plugin-react";

export default defineConfig({
  ignores: ["**/.react-router/**", ".config/*", "build/**"],
  plugins: {
    react,
  },

  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
  ],
});
