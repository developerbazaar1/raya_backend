const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['node_modules', 'dist', 'build', 'coverage', '*.log', '.git']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __filename: 'readonly',
        __dirname: 'readonly'
      }
    },
    rules: {
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error']
        }
      ],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always']
    }
  },
  eslintConfigPrettier
];
