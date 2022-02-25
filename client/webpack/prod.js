const { merge } = require('webpack-merge')
const common = require('./common.js')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
    mode: 'production',
    // devtool: 'source-map',
    optimization: {
        minimizer: [
            // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
            // `...`,
            new TerserPlugin(),
        ],
    },
})
