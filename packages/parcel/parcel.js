"use strict";

module.exports = function(bundler) {
    bundler.addAssetType("css", require.resolve("./asset.js"));
};
