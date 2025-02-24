module.exports = {
  // Not extending @valora/eslint-config-typescript
  // because it pulls react and jest which we don't want here
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
}
