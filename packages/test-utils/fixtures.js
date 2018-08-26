"use strict";

const fs = require("fs");
const path = require("path");

const dedent = require("dedent");
const globby = require("globby");
const tempy = require("tempy");
const shell = require("shelljs");

const root = path.resolve(__dirname, "../../fixtures");

exports.find = (search) => {
    const results = globby.sync(`**/${search}`, {
        cwd       : root,
        onlyFiles : false,
        absolute  : true,
    });

    if(!results.length) {
        throw new Error(`No fixtures found for "${search}"`);
    }

    if(results.length > 1) {
        throw new Error(`Multiple fixtures found, ${results.join(", ")}`);
    }

    return results[0];
};

let dir;

// Reset dir before each test
beforeEach(() => {
    dir = false;
});

exports.temp = (...args) => {
    if(!dir) {
        dir = tempy.directory();
    }

    return path.join(dir, ...args);
};

exports.write = (file, contents) => {
    fs.writeFileSync(file, dedent(contents), "utf8");
};

exports.copy = (from, to) => {
    const source = exports.find(from);

    shell.cp("-r", shell.test("-d", source) ? `${source}/*` : source, to);
};
