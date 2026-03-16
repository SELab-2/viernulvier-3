import { type Config } from "prettier";

const config: Config = {
  arrowParens: "always",
  bracketSameLine: false,
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  printWidth: 88,
  quoteProps: "consistent",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
};

export default config;
