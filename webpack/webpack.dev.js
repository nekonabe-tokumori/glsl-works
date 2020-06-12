const path = require('path');
const merge = require('webpack-merge');
const config = require('./webpack.common.js');

module.exports = merge(config, {
	mode: 'development',
	devtool: 'inline-source-map',
	// Enables dev server to be accessed by computers in local network
	devServer: {
		host: "0.0.0.0",
		port: 8000,
		contentBase: [
			path.join(__dirname, "../dist"),
			path.join(__dirname, "../public")
		],
		publicPath: "/",
		compress: true,
		watchOptions: {
			poll: true
		},
		disableHostCheck: true
	}
});
