"use strict";

const from = require("resolve-from");

module.exports = (args = {}) => {
    const options = Object.assign(
        Object.create(null),
        {
            paths : [],
        },
        args
    );
    
    return (src, file) => {
        var result;

        options.paths.some((dir) =>
            (result = from.silent(dir, file))
        );

        return result;
    };
};
