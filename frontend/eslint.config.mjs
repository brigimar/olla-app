// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tailwindPlugin from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      tailwindcss: tailwindPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'tailwindcss/classnames-order': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
];
