import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const buttonVariantRule = {
  selector: 'JSXOpeningElement[name.name="Button"]:not(:has(JSXAttribute[name.name="variant"])):not(:has(JSXSpreadAttribute))',
  message: 'MUI <Button> must set variant explicitly (contained | outlined | text).',
}
const mockImportPattern = {
  group: ['**/mock-*', '@/test/fixtures/**'],
  message: 'Production code must not import mock data or test fixtures; DEV-only fixtures load via dynamic import behind runtimeFixturesEnabled().',
}
const nativeFormRules = [
  { selector: 'JSXOpeningElement[name.name="select"]', message: 'Use ErgSelect instead of a native <select>.' },
  {
    selector: 'JSXOpeningElement[name.name="input"]:has(JSXAttribute[name.name="type"][value.value=/^(date|datetime-local|time)$/])',
    message: 'Use ErgTextField / MUI date pickers instead of a native date or time <input>.',
  },
]

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
      // state synchronization and third-party hooks without indicating runtime bugs,
      // so they stay visible as warnings until the existing hits are cleaned up.
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // This repository intentionally co-locates route helpers and constants with components.
      'react-refresh/only-export-components': 'off',
      // Existing feature gates use static boolean branches so disabled flows are tree-shaken.
      'no-constant-binary-expression': 'off',
      'no-constant-condition': 'off',
      // Vietnamese copy and embedded SVG/data strings can contain intentional Unicode spacing/escapes.
      'no-irregular-whitespace': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Mock data and test fixtures never ship in production code. Tests and src/test are exempt.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [mockImportPattern] }],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      // Infrastructure must not depend on route/page composition.
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/app/**'], message: 'lib code cannot import app pages or route composition.' }, mockImportPattern],
      }],
    },
  },
  {
    files: ['src/platform/**/*.{ts,tsx}'],
    rules: {
      // Platform services stay below feature modules to avoid dependency cycles.
      'no-restricted-imports': ['error', {
        patterns: [{ group: ['@/features/**'], message: 'platform code cannot import feature modules.' }, mockImportPattern],
      }],
    },
  },
  {
    // The theme default is variant="text"; every MUI <Button> must state its variant (one "contained" CTA per page).
    // Flat-config entries with the same rule key override each other, so every no-restricted-syntax
    // selector that applies to a file must live in the array that is last to match it.
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': ['error', buttonVariantRule],
    },
  },
  {
    // Forms in features use ErgSelect / ErgTextField / MUI date pickers, never native widgets.
    files: ['src/features/**/*.tsx'],
    // The classic quiz editor styles its two native <select> with classic-editor.css; migrate with that stylesheet.
    ignores: [
      '**/*.test.tsx',
      'src/features/lcms/quiz/quiz-editor/components/question-editor/question-settings.tsx',
      'src/features/lcms/quiz/quiz-editor/components/question-editor/feedback-scoring.tsx',
    ],
    rules: {
      'no-restricted-syntax': ['error', buttonVariantRule, ...nativeFormRules],
    },
  },
])
