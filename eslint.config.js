import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  // docs/ — tooling для PDF-гайда (Playwright-скрипты), не app-код
  { ignores: ['dist', 'src-tauri', 'docs', 'test-results', 'playwright-report', 'design-ref', '.claude'] },
  js.configs.recommended,
  {
    // Node-скрипты (tooling, не app-код)
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // TypeScript сам проверяет необъявленные идентификаторы (React UMD global, __dirname в vite.config)
      'no-undef': 'off',
      // Конституция: console.* только в DEV-ветках с явным eslint-disable
      'no-console': 'error',
      // Конституция: non-null assertion только с комментарием-обоснованием
      '@typescript-eslint/no-non-null-assertion': 'error',
      // autoFocus осознанно используется в popup-переводчике и модалке добавления
      // слова: это desktop-окна с единственным primary-полем ввода (UX-требование).
      'jsx-a11y/no-autofocus': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];
