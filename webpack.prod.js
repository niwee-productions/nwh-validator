const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = merge(common, {
    mode: "development",
    output: {
        clean: true,
    },
    devtool: "hidden-nosources-source-map",
    plugins: [
        new ESLintPlugin(),
    ],
});
