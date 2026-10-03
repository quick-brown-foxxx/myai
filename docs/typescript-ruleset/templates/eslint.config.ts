import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

/**
 * TypeScript strict ruleset — copy into a project and adjust the marked blocks.
 *
 * Composition notes:
 * - `defineConfig` (from `eslint/config`), NOT `tseslint.config` (deprecated).
 * - Presets are spread as WHOLE arrays. Never index into them: `configs.strictTypeChecked[1]`
 *   is the eslint-recommended shim, not the rules that justify typed linting.
 * - Prettier is assumed present and owns formatting. `eslint-config-prettier` is last.
 * - Typed linting requires `tsconfig` project coverage. See the tsconfig templates.
 */
export default defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/node_modules/**',
      '**/*.d.ts',
      // TS-first baseline: plain JS is out of scope. These would otherwise fail
      // `projectService` because no tsconfig covers them.
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
  },

  js.configs.recommended,

  // Correctness + type-aware correctness. Supersets: do not also add recommended/strict.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Import hygiene. The resolver is required for subpath exports and extensionless
  // imports under `moduleResolution: bundler` with no `baseUrl`.
  // ---------------------------------------------------------------------------
  {
    plugins: { import: importPlugin },
    settings: {
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': { typescript: { alwaysTryTypes: true } },
    },
    rules: {
      'import/no-unresolved': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Opinionated deltas. This is the personal layer; keep it small and named.
  // Each rule maps to a bug family, not to taste.
  // ---------------------------------------------------------------------------
  {
    rules: {
      // Unused code: ESLint owns it. tsconfig noUnusedLocals/Parameters stay OFF.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Coercion. Use ['error', 'always', { null: 'ignore' }] if `x == null` is wanted.
      eqeqeq: ['error', 'always'],

      // Required by `verbatimModuleSyntax`; no preset provides these.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Union drift. A `default:` does NOT satisfy it; add
      // { considerDefaultExhaustiveForUnions: true } if that is intended.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Named booleans/nullables only. Kept strict on purpose: catches empty-string/0.
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      // Enforced for named/non-generic functions. Do NOT set
      // allowFunctionsWithoutTypeParameters: true — it makes the rule a no-op.
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
          allowFunctionsWithoutTypeParameters: false,
          allowedNames: [],
          allowIIFEs: true,
        },
      ],

      // `object` says nothing about shape. Partial (not Record) because keys are optional.
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            object: {
              message:
                'Use Partial<Record<string, unknown>> or a specific interface, not `object`.',
              fixWith: 'Partial<Record<string, unknown>>',
            },
          },
        },
      ],

      'no-console': ['error', { allow: ['warn', 'error'] }],

      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Stylistic trim: drop bikeshed, keep the useful consistency rules.
  // ---------------------------------------------------------------------------
  {
    rules: {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  // ---------------------------------------------------------------------------
  // Test zone: same typed core, only untyped boundaries relax.
  // Async/module discipline (no-floating-promises, no-misused-promises,
  // await-thenable, consistent-type-imports) is intentionally PRESERVED.
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/tests/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
    },
  },

  // Vitest plugin. Remove if the project does not use Vitest.
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/tests/**'],
    plugins: { vitest },
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/expect-expect': [
        'error',
        {
          assertFunctionNames: [
            'expect',
            'expectTypeOf',
            'assertType',
            'assert',
          ],
        },
      ],
      'vitest/valid-expect': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/no-standalone-expect': 'error',
    },
  },

  eslintConfigPrettier,
);
