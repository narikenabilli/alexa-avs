const webpack = require('webpack');
const webpackMerge = require('webpack-merge'); // eslint-disable-line import/no-extraneous-dependencies
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const defaultConfig = require('./default');

module.exports = webpackMerge(defaultConfig, {
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new OptimizeCssAssetsPlugin({
      cssProcessorOptions: {
        discardComments: { removeAll: true },
        safe: true,
        autoprefixer: {
          add: true,
          browsers: [
            'last 8 version',
            'IE 9'
          ]
        }
      }
    }),
  ],
});
