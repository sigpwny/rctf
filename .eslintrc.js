module.exports = {
  env: {
    es6: true
  },
  extends: [
    'standard',
    'eslint:recommended',
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "project": ["./tsconfig.json"] },
  // parserOptions: {
  //   ecmaFeatures: {
  //   },
  //   ecmaVersion: 2018,
  //   sourceType: 'module'
  // },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-multiple-empty-lines': ['error', {
      max: 1,
      maxEOF: 0,
      maxBOF: 0
    }],
    'padding-line-between-statements': ['error',
      { blankLine: 'always', prev: 'block-like', next: 'export' }
    ],
    'no-void': ['error', {
      allowAsStatement: true
    }]
  }
}
