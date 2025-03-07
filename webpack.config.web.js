const path = require('path');

module.exports = {
    entry: './src/server/index.ts',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist/server'),
        filename: 'index.js'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            "@Commons": path.resolve(__dirname, "src/common"),
            "@Models": path.resolve(__dirname, "src/models"),
            "@Glibs": path.resolve(__dirname, "src/gsdk/src"),
        }
    }
};

