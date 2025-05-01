const path = require('path');
const g_resolve = {
    extensions: ['.ts', '.js'],
    alias: {
        "@Commons": path.resolve(__dirname, "src/common"),
        "@Models": path.resolve(__dirname, "src/models"),
        "@Glibs": path.resolve(__dirname, "src/gsdk/src"),
        "@GBlibs": path.resolve(__dirname, "src/libs/src"),
        "@Webs": path.resolve(__dirname, "src/wlibs/src"),
    },
}
const g_module = {
    rules: [
        {
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }
    ]
}
const mode = process.env.ENV || 'development'

module.exports = [{
    name: 'server',
    entry: './src/server/index.ts',
    target: 'node',
    mode: mode,
    output: {
        path: path.resolve(__dirname, 'dist/server'),
        filename: 'index.js'
    },
    module: g_module,
    resolve: g_resolve,
    externals: {
        'classic-level': 'commonjs2 classic-level',
        'level': 'commonjs2 level'
    }
},

// 🔹 렌더러 설정
{
    name: 'renderer',
    entry: './src/renderer/index.ts',
    target: 'web', // 또는 'electron-renderer'로 변경 가능
    mode: mode,
    output: {
        path: path.resolve(__dirname, 'dist/renderer'),
        filename: 'index.js'
    },
    module: g_module,
    resolve: {
        ...g_resolve,
        fallback: {
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            buffer: require.resolve("buffer"),
            vm: false,
        },
    },
}];

