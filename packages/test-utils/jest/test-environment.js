"use strict";

const NodeEnvironment = require("jest-environment-node");

const tempy = require("tempy");
const shell = require("shelljs");

// All this just to get global.fixtures available in tests...
class CustomEnvironment extends NodeEnvironment {
    async setup() {
        const dir = tempy.directory();

        shell.cp("-rf", "./fixtures/*", dir);
        
        this.global.fixtures = dir;
        
        await super.setup();
    }

    async teardown() {
        shell.rm("-rf", this.global.fixtures);

        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = CustomEnvironment;
