const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.js",
    test: "./src/solver/constraintsTest.js",
    blobby: "./src/portal/blobby.js",
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js",
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new HtmlWebPackPlugin({
      name: "index",
      template: "./src/index.html",
      filename: "index.html",
      chunks: ['index']
    }),
    new HtmlWebPackPlugin({
      name: "test",
      template: "./src/index.html",
      filename: "test.html",
      chunks: ['test']
    }),
    new HtmlWebPackPlugin({
      name: "blobby",
      template: "./src/index.html",
      filename: "blobby.html",
      chunks: ['blobby']
    }),
  ],
  devtool: "source-map",
}