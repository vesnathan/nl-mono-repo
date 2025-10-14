/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  settings: {
    // Let eslint-plugin-import resolve TypeScript path aliases using the root tsconfig
    'import/resolver': {
      typescript: {
        // point to the root tsconfig so package aliases are resolved via "paths"
        project: ['./tsconfig.json'],
      },
    },
  },
};
