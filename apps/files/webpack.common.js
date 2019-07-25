const VueLoaderPlugin = require('vue-loader/lib/plugin')
const path = require('path')

module.exports = {
  plugins: [
    new VueLoaderPlugin()
  ],
  entry: {
    files: './src/default.js'
  },
  output: {
    publicPath: 'apps/files/',
    chunkFilename: '[name].files.chunk.js',
    filename: 'files.bundle.js',
    library: 'files'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve('src')
        ],
        options: {
          rootMode: 'upward'
        }
      },
      {
        test: /\.jsx?$/,
        include: /node_modules\/(?=(vue2-dropzone)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    ie: '11'
                  }
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        exclude: [/node_modules/]
      }, {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      }]
  }
}
