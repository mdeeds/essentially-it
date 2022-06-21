const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.js",
    test: "./src/solver/constraintsTest.js",
    portalTest: "./src/portal/portalTest.js",
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
      name: "portalTest",
      template: "./src/index.html",
      filename: "portalTest.html",
      chunks: ['portalTest']
    }),
  ],
  devtool: "source-map",
}