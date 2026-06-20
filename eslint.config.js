export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        alert: "readonly",
        FormData: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly"
      }
    },
    rules: {
      "semi": ["error", "always"],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-undef": "error"
    }
  }
];
