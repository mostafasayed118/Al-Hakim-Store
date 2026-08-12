import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import clerkNext from "@clerk/eslint-plugin/next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Convex-generated files — never lint generated code.
    "convex/_generated/**",
  ]),
  {
    rules: {
      // Standard TS convention: `_`-prefixed args/vars are intentionally unused.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Clerk auth-protection gate: every App Router resource must perform an
  // authentication check (auth()/auth.protect() server-side, or Clerk hooks
  // like useAuth()/useUser() in client components). Public routes are opted
  // out explicitly. Mirrors the route-level protection in middleware.ts.
  {
    plugins: { "@clerk/next": clerkNext },
    rules: {
      "@clerk/next/require-auth-protection": [
        "error",
        {
          protected: ["**"],
          public: [
            // Storefront landing page + root layout (public by design).
            // Exact-folder match: covers app/page.tsx + app/layout.tsx only.
            "app",
            // Signature-verified webhook endpoint.
            "app/api/webhooks/**",
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
