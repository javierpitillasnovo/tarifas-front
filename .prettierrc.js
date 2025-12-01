'use strict';

module.exports = {
	semi: true,
	singleQuote: true,
	printWidth: 100,
	trailingComma: 'none',
	tabWidth: 2,
	useTabs: true,
	quoteProps: 'as-needed',
	endOfLine: 'lf',
	overrides: [
		{
			files: '*.html',
			options: {
				parser: 'html'
			}
		},
		{
			files: '*.component.html',
			options: {
				parser: 'angular'
			}
		}
	]
};
