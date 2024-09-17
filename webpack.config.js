const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/iostack_client.ts",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        globalObject: "this",
        library: "iostackClient",
    },
    externals: {
        "jwt-decode": {
            commonjs: "jwt-decode",
            commonjs2: "jwt-decode",
            amd: "jwt-decode",
            root: "jwt_decode", // Global variable name for browsers
        },
    },
    optimization: {
        minimize: false
    }    
};
