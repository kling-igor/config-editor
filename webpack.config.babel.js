import webpack from 'webpack'
import HTMLWebpackPlugin from 'html-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { resolve, join } from 'path'
import packagejson from './package.json'

module.exports = env => ({
  entry: join(__dirname, 'src', 'index.js'),
  output: {
    filename: '[name].[hash].js',
    path: join(__dirname, 'app')
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|lodash)[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  },

  watch: false,

  node: {
    fs: 'empty'
  },

  watchOptions: {
    aggregateTimeout: 100
  },

  devtool: env.dev ? 'inline-source-map' : false,

  resolve: {
    modules: [join(__dirname, '.'), join(__dirname, 'src')]
  },

  plugins: [
    new HTMLWebpackPlugin({
      title: packagejson.description,
      filename: 'index.html',
      template: join(__dirname, 'src', 'index.html'),
      inject: 'body',
      hash: true,
      debug: env.dev
    }),
    (() =>
      env.dev
        ? new BundleAnalyzerPlugin({
            analyzerMode: 'server'
          })
        : null)()
  ].filter(p => p),

  module: {
    rules: [
      {
        test: /.jsx?$/,
        include: [join(__dirname, 'src')],
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        include: join(__dirname, 'src'),
        use: 'file-loader'
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.css']
  }
})
