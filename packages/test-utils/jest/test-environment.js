"use strict";

const path = require("path");

const NodeEnvironment = require("jest-environment-node");

const temp = require("temp-dir");
const shell = require("shelljs");

// All this just to get global.fixtures available in tests...
class CustomEnvironment extends NodeEnvironment {
    async setup() {
        const dir = path.join(temp, "/modular-css-fixtures");

        shell.rm("-rf", dir);
        shell.cp("-rf", "./fixtures", dir);
        
        this.global.fixtures = dir;
        
        await super.setup();
    }

    async teardown() {
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = CustomEnvironment;
