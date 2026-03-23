const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  entry: './code.tsx',
  output: {
    filename: 'code.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      '__html__': JSON.stringify(fs.readFileSync('./ui.html', 'utf8')).replace(/[^\x00-\x7F]/g, c => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0')),
    }),
  ],
};
