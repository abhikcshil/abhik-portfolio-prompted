import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "**/.next/**",
    "**/.wrangler/**",
    "**/dist/**",
    "**/node_modules/**",
    "worker-configuration.d.ts",
  ]),
]);

export default eslintConfig;
