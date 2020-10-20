const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './levelEditor.js',
  plugins: [new webpack.ProgressPlugin()],

  resolve: {
    fallback: {
      buffer: false,
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [],
        loader: 'babel-loader',
      },
      {
        test: /.(scss|css)$/,

        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',

            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',

            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
};
