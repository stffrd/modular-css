"use strict";

const fs = require("fs");

const { toMatchSnapshot } = require("jest-snapshot");

expect.extend({
    toMatchFileSnapshot(source, ...args) {
        return toMatchSnapshot.call(
            this,
            fs.readFileSync(source, "utf8"),
            ...args,
        );
    },
});
