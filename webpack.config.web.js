const path = require('path');

module.exports = {
    entry: './src/server/index.ts',
    target: 'node',
    mode: process.env.ENV || 'development',
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
            "@GBlibs": path.resolve(__dirname, "src/libs/src"),
        }
    },
    externals: {
        'classic-level': 'commonjs2 classic-level',
        'level': 'commonjs2 level'
    }
};

