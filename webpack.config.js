const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
var PACKAGE = require("./package.json");

module.exports = {
    entry: path.resolve(__dirname, "./src/client.js"),
    devtool: "inline-source-map",
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: `client-${PACKAGE.version}.web.min.js`,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin()
    ],
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin(
              {
                terserOptions: {
                    format: {
                        preamble: `/* Copyright ${new Date().getUTCFullYear()}, iostack.ai, ${PACKAGE.name} ${PACKAGE.version} (${new Date().toUTCString()}) */`,
                    }
                },
              }
            )
        ],
    }
};
