const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const buildPath = path.resolve(__dirname, 'dist');
const ConcatPlugin = require('webpack-concat-plugin');

const config = {
  entry: {
    main: [
      './src/js/controller/window.js',
    ],
  },
  // Render source-map file for final build
  devtool: 'source-map',
  // output config
  output: {
    path: buildPath, // Path of output file
    filename: 'window.js', // Name of output file
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
      // { from: 'js/controller/background.js', to: 'background.js'},
      // { from: 'js/model', to: 'model'},
      { from: 'manifest.json', to: 'manifest.json'},
      { from: 'window.html', to: 'window.html'}
    ], {context: path.resolve(__dirname, 'src')}),
    new ConcatPlugin({
      uglify: true,
      sourceMap: false,
      fileName: 'background.js',
      filesToConcat: ['./src/js/model/**', './src/js/controller/background.js']
    })
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
