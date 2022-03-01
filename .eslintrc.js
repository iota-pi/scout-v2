module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'plugin:react/recommended',
  ],
  rules: {
    '@typescript-eslint/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    '@typescript-eslint/no-use-before-define': ['error', { 'functions': false }],
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_$' }],
    'arrow-parens': ['error', 'as-needed'],
    'class-methods-use-this': 'off',
    'import/no-cycle': 'off',
    'no-bitwise': 'off',
    'no-console': 'off',
    'no-continue': 'off',
    'no-else-return': ['error', { allowElseIf: true }],
    'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-restricted-syntax': [
      'error',
      // Taken from eslint-airbnb-config and removed rule forbidding `for ... of` loops
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'object-curly-newline': 'off',
    'prefer-destructuring': 'off',
    'radix': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-indent': ['error', 2, {checkAttributes: true, indentLogicalExpressions: true}],
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/react-in-jsx-scope': 'off',
    "react/require-default-props": 'off',
  },
  overrides: [
    {
      files: ['*.spec.[tj]s', '*.test.[tj]s'],
      rules: {
        '@typescript-eslint/dot-notation': 'off',
      },
    }
  ],
};
