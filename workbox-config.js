module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{ico,svg,html,json,png,js,css}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};