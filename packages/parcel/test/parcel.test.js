/* eslint consistent-return: off */
"use strict";

const fs = require("fs");

const Bundler = require("parcel-bundler");
const tree = require("parcel-assert-bundle-tree");
const dedent = require("dedent");
const shell  = require("shelljs");

const read     = require("test-utils/read.js")(__dirname);
const exists   = require("test-utils/exists.js")(__dirname);
const namer    = require("test-utils/namer.js");
const watching = require("test-utils/rollup-watching.js");

const plugin = require("../parcel");

const output = "./packages/parcel/test/output";
const watch = false;
const cache = false;
const hmr = false;

describe("/parcel.js", () => {
    /* eslint max-statements: "off" */
    
    // afterEach(() => shell.rm("-rf", `${output}/*`));
    
    it("should be a function", () =>
        expect(typeof plugin).toBe("function")
    );
    
    it("should generate exports", async () => {
        const b = new Bundler(require.resolve("./specimens/simple.html"), {
            outDir : `${output}/exports`,
            watch,
            cache,
            hmr,
        });

        await plugin(b);

        const bundle = await b.bundle();

        console.log(bundle);

        tree(bundle, {
            name         : "simple.html",
            assets       : [ "simple.html" ],
            childBundles : [
                {
                    type   : "js",
                    assets : [ "simple.css", "simple.js" ]
                }
            ]
        });
    });
});
