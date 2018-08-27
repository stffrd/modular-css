"use strict";

module.exports = {
    restoreMocks : true,
    notify       : true,

    // Use custom environment that copies fixtures to temp before running tests
    testEnvironment : "./packages/test-utils/jest/test-environment.js",

    // Work around JsDOM security issue
    // https://github.com/facebook/jest/issues/6766
    testURL : "http://localhost/",

    coveragePathIgnorePatterns : [
      "/node_modules/",
      "/parsers/",
      "/test-utils/",
    ],

    watchPathIgnorePatterns : [
        "/records/",
    ],
};
