const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const buildPath = path.resolve(__dirname, 'dist');

const config = {
  entry: {
    main: [
      './src/app/app.js',
    ],
  },
  // Render source-map file for final build
  devtool: 'source-map',
  // output config
  output: {
    path: buildPath, // Path of output file
    filename: 'app.js', // Name of output file
  },
  plugins: [
    // Define production build to allow React to strip out unnecessary checks
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    // Clean build folder
    new CleanWebpackPlugin([buildPath]),
    // Transfer Files
    new CopyWebpackPlugin([
      { from: '_locales', to: '_locales' },
      { from: 'icons', to: 'icons' },
      { from: 'clang-newlib', to: 'clang-newlib'},
      { from: 'app/controller/background.js', to: 'background.js'},
      { from: 'app/model', to: 'model'},
      { from: 'manifest.json', to: 'manifest.json'},
      { from: 'window.html', to: 'window.html'}
    ], {context: path.resolve(__dirname, 'src')}),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
        },
      },
    ],
  },
};

module.exports = config;
