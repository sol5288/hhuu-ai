module.exports = {
  root: true,
  extends: ['@antfu', 'plugin:prettier/recommended'],
  rules: {
    'no-tabs': 0,
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'lf',
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
        bracketSpacing: true,
        arrowParens: 'always',
        htmlWhitespaceSensitivity: 'css',
        vueIndentScriptAndStyle: true,
        vueComponentPropsOrder: ['props', 'data', 'computed', 'methods', 'watch', 'lifecycle hooks'],
      },
    ],
  },
  globals: {
    WeixinJSBridge: false,
    wx: false,
    loginCount: true,
  },
}
