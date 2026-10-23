import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Cargo/Tauri writes compressed generated assets under target; they are not
  // source files and must never be parsed as JavaScript by the repository lint.
  globalIgnores(['dist', 'src-tauri/target', '**/target', '.agent-artifacts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // React Compiler adoption is incremental. These rules flag established
      // state synchronization and third-party hooks without indicating runtime bugs.
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // This repository intentionally co-locates route helpers and constants with components.
      'react-refresh/only-export-components': 'off',
      // Existing feature gates use static boolean branches so disabled flows are tree-shaken.
      'no-constant-binary-expression': 'off',
      'no-constant-condition': 'off',
      // Vietnamese copy and embedded SVG/data strings can contain intentional Unicode spacing/escapes.
      'no-irregular-whitespace': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      // Infrastructure must not depend on route/page composition.
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/app/**'], message: 'lib code cannot import app pages or route composition.' }],
      }],
    },
  },
  {
    files: ['src/platform/**/*.{ts,tsx}'],
    rules: {
      // Platform services stay below feature modules to avoid dependency cycles.
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/features/**'], message: 'platform code cannot import feature modules.' }],
      }],
    },
  },
])
