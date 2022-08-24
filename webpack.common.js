const path = require("path");
const webpack = require("webpack");
const WebpackMessages = require('webpack-messages');
const WebpackBar = require('webpackbar');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    watchOptions: {
        aggregateTimeout: 200,
        poll: 1000,
    },
    resolve: {
        fallback: {
            "fs": false
        },
    },
    entry: "/src/nwhval.js",
    output: {
        path: path.join(__dirname, "dist"),
        filename: 'nwhval.min.js',
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.s?css$/,
                use: [
                    'css-loader',
                    'sass-loader'
                ]
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new UglifyJsPlugin({
            include: /\.min\.js$/
        })]
    },
    plugins: [
        new webpack.BannerPlugin(`Copyright 2022 NiWee Productions.`),
        new WebpackMessages({
            name: 'NWHVal',
            logger: str => console.log(`>> ${str}`)
        }),
        new WebpackBar({
            name: "NWHVal",
            color: "#006994",
            basic: false,
            profile: true,
            fancy: true,
            reporters: [
                'fancy',
            ],
        }),
    ],
};
