// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = tseslint.config(
	{
		ignores: [
			'dist/**' // Ignora la carpeta dist
		]
	},
	{
		files: ['**/*.ts'],
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.recommended,
			...angular.configs.tsRecommended,
			eslintPluginPrettierRecommended
		],
		processor: angular.processInlineTemplates,
		rules: {
			// Reglas Angular
			'@angular-eslint/directive-selector': [
				'error',
				{
					type: 'attribute',
					prefix: 'app',
					style: 'camelCase'
				}
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'app',
					style: 'kebab-case'
				}
			],

			// Reglas TypeScript
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/consistent-type-imports': 'error',
			'prefer-const': 'error',

			// Estilo
			quotes: ['error', 'single', { avoidEscape: true }],
			semi: ['error', 'always'],
			eqeqeq: ['error', 'always']
		}
	},
	{
		files: ['**/*.html'],
		extends: [
			...angular.configs.templateRecommended,
			...angular.configs.templateAccessibility,
			eslintPluginPrettierRecommended
		],
		rules: {
			// Reglas de templates
			'@angular-eslint/template/alt-text': ['error'],
			'@angular-eslint/template/click-events-have-key-events': 'error',
			'@angular-eslint/template/interactive-supports-focus': 'error',
			'@angular-eslint/template/no-positive-tabindex': 'error'
		}
	},
	{
		// Configuración opcional para archivos de test
		files: ['**/*.spec.ts'],
		rules: {
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	}
);
