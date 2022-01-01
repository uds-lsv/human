const path = require('path')
const webpack = require('webpack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
    entry: './app/static/start.ts',
    optimization: {
        splitChunks: {
            cacheGroups: {
                styles: {
                    name: 'styles',
                    type: 'css/mini-extract',
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
        minimizer: [
            // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
            // `...`,
            new CssMinimizerPlugin(),
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: 'app.css' }),
        // new webpack.ProvidePlugin({
        //     $: 'jQuery',
        // }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', 'css'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../app/static/dist'),
        clean: true,
    },
    stats: {
        orphanModules: true,
    },
}
