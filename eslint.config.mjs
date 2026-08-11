import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "project/rules",
    rules: {
      // The codebase legitimately handles untyped Supabase rows in many
      // places; keep `any` visible as a warning rather than blocking CI.
      "@typescript-eslint/no-explicit-any": "warn",
      // `_`-prefixed bindings are intentionally unused (matches existing
      // convention, e.g. `_code` in handleVerifyCode).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // React Compiler is not enabled in next.config.ts. The compiler-era
      // rules in eslint-plugin-react-hooks (v7+) assume the compiler is
      // active, so they are disabled here; the classic Rules of Hooks rules
      // remain enabled below.
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party vendored code that is not part of this project.
    ".qodo/**",
    "mobile/**",
    ".expo/**",
    "supabase/**",
  ]),
]);

export default eslintConfig;
