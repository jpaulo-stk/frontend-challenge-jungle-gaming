import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
    "lighthouse",
    "design",
    "public/mockServiceWorker.js",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Rest destructuring is how private fields are dropped from objects.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          // TanStack Router control flow: `throw redirect()` / `throw notFound()`.
          allow: [
            {
              from: "package",
              package: "@tanstack/router-core",
              name: ["Redirect", "NotFoundError"],
            },
            // MSW resolvers may throw a mocked response to end the request early.
            { from: "package", package: "msw", name: ["HttpResponse"] },
          ],
        },
      ],
      "no-console": "error",
      "no-restricted-exports": [
        "error",
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSTypeReference[typeName.left.name='React'][typeName.right.name='FC']",
          message: "Use a named function component with typed props instead of React.FC.",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"], reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui convention: cva variant helpers live next to their component.
      "react-refresh/only-export-components": [
        "error",
        {
          allowConstantExport: true,
          allowExportNames: ["buttonVariants", "badgeVariants", "tabsListVariants"],
        },
      ],
    },
  },
  {
    // Tooling entry points that must use default exports.
    files: ["*.config.{ts,js}", "scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-restricted-exports": "off",
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Boundaries: features are isolated, shared never imports features
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.app.json" },
      },
      "boundaries/include": ["src/**/*"],
      "boundaries/files": [{ category: "entry", pattern: "src/main.tsx" }],
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "feature", pattern: "src/features/*", capture: ["featureName"] },
        { type: "shared", pattern: "src/shared" },
        { type: "mocks", pattern: "src/mocks" },
        { type: "styles", pattern: "src/styles" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { file: { categories: "entry" } },
              allow: {
                to: { element: { types: { anyOf: ["app", "shared", "mocks", "styles"] } } },
              },
            },
            {
              from: { element: { type: "app" } },
              allow: {
                to: { element: { types: { anyOf: ["app", "feature", "shared", "styles"] } } },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: [
                  { element: { type: "shared" } },
                  {
                    element: {
                      type: "feature",
                      captured: { featureName: "{{ from.captured.featureName }}" },
                    },
                  },
                ],
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              // Mocks reuse the zod contracts declared by each feature.
              from: { element: { type: "mocks" } },
              allow: { to: { element: { types: { anyOf: ["mocks", "shared", "feature"] } } } },
            },
          ],
        },
      ],
    },
  },
]);
