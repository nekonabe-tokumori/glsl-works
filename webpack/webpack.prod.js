const merge = require('webpack-merge');
const config = require('./webpack.common.js');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(config, {
	mode: 'production',
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: 'public/assets', to: 'assets' },
				{ from: 'public/lib', to: 'lib' }
			]
		})
	]
});
