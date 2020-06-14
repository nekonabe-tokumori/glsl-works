const path = require("path");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// http://webpack.github.io/docs/configuration.html
module.exports = {
	entry: {
		main: "./src/index.ts",
	},

	output: {
		path: path.resolve(__dirname, '../dist'),
		filename: "js/[name].js"
	},

	resolve: {
		extensions: [".js", ".ts", ".tsx"],
		alias: {},
	},

	module: {
		// Test file extension to run loader
		rules: [
			{
				test: /\.(glsl|vert|frag)$/,
				loader: "ts-shader-loader"
			},
			{
				test: /\.tsx?$/,
				exclude: [/node_modules/, /tsOld/],
				loader: "ts-loader"
			}
		]
	},

	externals: {
		three: "THREE"
	},

	plugins: [
		// new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			title: 'Toon Water',
			template: './public/index.html',
		}),
	],
}
