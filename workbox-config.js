module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{html,ico,svg,json,png,js,css}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};