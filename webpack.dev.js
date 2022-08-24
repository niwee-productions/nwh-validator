const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = merge(common, {
  devtool: "source-map",
  plugins: [
    new ESLintPlugin(),
  ],
});
