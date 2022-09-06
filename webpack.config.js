const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.js",
    test: "./src/solver/constraintsTest.js",
    portalTest: "./src/portal/portalTest.js",
    firestarter: "./src/firestarter/firestarter.js"
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
      name: "firestarter",
      template: "./src/index.html",
      filename: "firestarter.html",
      chunks: ['firestarter']
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