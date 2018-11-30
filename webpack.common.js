const path = require('path');
const fs = require('fs')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const WebpackCopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require ('html-webpack-plugin')

const appFolder = path.resolve(__dirname, 'apps')
let apps = []

if(fs.existsSync('config.json')) {
  var config = require('./config.json')
}else{
  var config = require('./tests/drone/config.json')
}

config.apps
		.forEach(function (mod) {
							if(fs.existsSync(path.resolve(appFolder, mod))){
								var modPath = {
									from: path.resolve('apps', mod ,'dist'),
									to: path.resolve(__dirname, 'dist', 'apps', mod)
								}
								apps.push(modPath)
							}
						})

const src_files = [{
						        from: path.resolve(__dirname, 'sw.js'),
						        to: path.resolve(__dirname, 'dist')
						      },{
						        from: path.resolve(__dirname, 'themes/**'),
						        to: path.resolve(__dirname, 'dist')
						      },{
						        from: path.resolve(__dirname, 'node_modules', 'requirejs', 'require.js'),
						        to: path.resolve(__dirname, 'dist', 'node_modules', 'requirejs')
						      }]
for(file of src_files){
  apps.push(file)
}
module.exports = {
	plugins: [
    new WebpackCopyPlugin(apps),
    new HtmlWebpackPlugin({
      template: 'index.html'
    }),
		new VueLoaderPlugin(),
		new MiniCssExtractPlugin({
				// Options similar to the same options in webpackOptions.output
				// both options are optional
				filename: "css/[name].css",
				chunkFilename: "css/[name].[id].css"
		})
	],
	entry: {
		core: [
			'./src/default.js',
			'./node_modules/material-design-icons-iconfont/dist/material-design-icons.css',
			'./node_modules/vuetify/dist/vuetify.css',
			'./static/fonts/ocft/css/ocft.css']
	},
	output: {
		filename: 'core/[name].bundle.js',
		chunkFilename: 'core/[name].[id].bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.js?$/,
				exclude: [/node_modules/, /apps/],
				include: [/src/]
			}, {
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				include: [/node_modules\/material-design-icons-iconfont\/dist/, /static\/fonts\/ocft\/font/],
				use: [{
						loader: 'file-loader',
						options: {
								name: '[name].[ext]',
								publicPath: '../fonts',
								outputPath: 'fonts'
						}
				}]
			},{
				test: /\.vue$/,
				loader: 'vue-loader',
				exclude: [/node_modules/]
			}, {
				test: /\.(sa|sc|c)ss$/,
				include: [/node_modules/,/src/, /static/],
				use: [
					"style-loader",
					MiniCssExtractPlugin.loader,
					"css-loader",
					"sass-loader"
				]
			}
		]
	},
	// some weird bug when loading js-owncloud-client, no idea... see https://github.com/webpack-contrib/css-loader/issues/447
	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	}
};
