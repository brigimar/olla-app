// eslint.config.js
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const nextPlugin = require('@next/eslint-plugin-next');
const reactHooks = require('eslint-plugin-react-hooks');
const tailwind = require('eslint-plugin-tailwindcss');

module.exports = [
  {
    ignores: ['node_modules', '.next', 'dist'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier,
      '@next/next': nextPlugin,   // 👈 clave correcta
      'react-hooks': reactHooks,
      tailwindcss: tailwind,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'prettier/prettier': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
];
