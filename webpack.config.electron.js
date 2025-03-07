const path = require('path');

module.exports = {
    entry: {
        main: './src/main/index.ts',
        renderer: './src/renderer/index.ts'
    },
    target: 'electron-main',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]/index.js'
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
        extensions: ['.ts', '.js']
    }
};

