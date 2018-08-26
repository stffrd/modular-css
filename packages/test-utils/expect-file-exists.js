"use strict";

const fs = require("fs");

expect.extend({
    fileExists(file) {
        const exists = fs.existsSync(file);

        if(exists) {
            return {
                message : () => `expected ${file} to not exist`,
                pass    : true,
            };
        }

        return {
            message : () => `expected ${file} to exist`,
            pass    : false,
        };
    },
});
