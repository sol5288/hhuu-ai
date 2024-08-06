module.exports = {
	root: true,
	env: {
		node: true,
		browser: true,
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-recommended',
		'airbnb-base',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: 'vue-eslint-parser',
	parserOptions: {
		ecmaVersion: 2021,
		parser: '@typescript-eslint/parser',
		sourceType: 'module',
	},
	plugins: ['vue', '@typescript-eslint'],
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'import/no-unresolved': 'off',
		'import/extensions': 'off',
		'import/no-extraneous-dependencies': 'off',
		'vue/multi-word-component-names': 'off',
		'import/prefer-default-export': 'off', // 규칙 비활성화
		'eslintimport/prefer-default-export': 'off', // 규칙 비활성화
	},
	globals: {
		WeixinJSBridge: 'readonly',
		wx: 'readonly',
		loginCount: 'writable',
	},
	overrides: [
		{
			files: ['package.json', 'tsconfig.json'],
			parser: 'jsonc-eslint-parser',
		},
	],
};
