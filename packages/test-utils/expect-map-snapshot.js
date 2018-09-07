"use strict";

const fs = require("fs");

const { toMatchSnapshot } = require("jest-snapshot");

expect.extend({
    toMatchMapSnapshot(source, ...args) {
        let json = source;

        if(typeof source === "string") {
            json = JSON.parse(fs.readFileSync(source, "utf8"));
        }

        return toMatchSnapshot.call(
            this,
            json,
            Object.assign(args[0] || {}, {
                sources : expect.any(Array),
            })
        );
    },
});
