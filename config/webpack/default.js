const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: ['./src/client/index.js'],

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../../dist'),
    publicPath: '/'
  },

  plugins: [
    new CleanWebpackPlugin(['dist'], {
      // fix for https://github.com/johnagan/clean-webpack-plugin/issues/10
      root: path.resolve(__dirname, '../../')
    }),
    new HtmlWebpackPlugin({
      template: 'src/client/index.html'
    }),
    new ExtractTextPlugin('styles.css'),
  ],

  module: {
     rules: [
      {
        test: /\.js$/,
        // couple of modules require babel
        exclude: /node_modules\/(?!(alexa-voice-service|http-message-parser)\/).*/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  }
};
