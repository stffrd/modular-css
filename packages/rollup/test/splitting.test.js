/* eslint max-statements: "off" */
"use strict";

const { rollup } = require("rollup");

const { cwd, temp, find } = require("test-utils/fixtures.js");
const namer = require("test-utils/namer.js");

require("test-utils/expect-dir-snapshot.js");

const plugin = require("../rollup.js");

const error = (root) => {
    throw root.error("boom");
};

error.postcssPlugin = "error-plugin";

const experimentalCodeSplitting = true;
const assetFileNames = "assets/[name][extname]";
const chunkFileNames = "[name].js";
const format = "es";
const map = false;
const sourcemap = false;
const json = true;

describe("/rollup.js", () => {
    describe("code splitting", () => {
        it("should support splitting up CSS files", async () => {
            const bundle = await rollup({
                experimentalCodeSplitting,
                
                input : [
                    find("simple.js"),
                    find("dependencies.js"),
                ],

                plugins : [
                    plugin({
                        cwd,
                        namer,
                        map,
                    }),
                ],
            });
    
            await bundle.write({
                format,
                sourcemap,

                assetFileNames,
                chunkFileNames,
                
                dir : temp(),
            });

            expect(temp("assets")).toMatchDirSnapshot();
        });

        it("should support splitting up CSS files w/ shared assets", async () => {
            const bundle = await rollup({
                experimentalCodeSplitting,

                input : [
                    find("css-chunks/a.js"),
                    find("css-chunks/b.js"),
                ],

                plugins : [
                    plugin({
                        cwd,
                        namer,
                        map,
                    }),
                ],
            });

            await bundle.write({
                format,
                sourcemap,

                assetFileNames,
                chunkFileNames,

                dir : temp(),
            });

            expect(temp("assets")).toMatchDirSnapshot();
        });
        
        it("shouldn't put bundle-specific CSS in common.css", async () => {
            const bundle = await rollup({
                experimentalCodeSplitting,

                input : [
                    find("common-splitting/a.js"),
                    find("common-splitting/c.js"),
                ],

                plugins : [
                    plugin({
                        cwd,
                        namer,
                        map,
                    }),
                ],
            });

            await bundle.write({
                format,
                sourcemap,

                assetFileNames,
                chunkFileNames,

                dir : temp(),
            });

            expect(temp("assets")).toMatchDirSnapshot();
        });

        it("should support manual chunks", async () => {
            const bundle = await rollup({
                experimentalCodeSplitting,

                input : [
                    find("manual-chunks/a.js"),
                    find("manual-chunks/b.js"),
                ],

                manualChunks : {
                    shared : [
                        find("manual-chunks/c.js"),
                    ],
                },

                plugins : [
                    plugin({
                        cwd,
                        namer,
                        map,
                    }),
                ],
            });

            await bundle.write({
                format,
                sourcemap,

                assetFileNames,
                chunkFileNames,

                dir : temp(),
            });

            expect(temp("assets")).toMatchDirSnapshot();
        });

        it("should support dynamic imports", async () => {
            const bundle = await rollup({
                experimentalCodeSplitting,

                // treeshake : false,

                input : [
                    find("dynamic-imports/a.js"),
                    find("dynamic-imports/b.js"),
                ],

                plugins : [
                    plugin({
                        cwd,
                        namer,
                        map,
                    }),
                ],
            });

            await bundle.write({
                format,
                sourcemap,

                assetFileNames,
                chunkFileNames,

                dir : temp(),
            });

            expect(temp("assets/")).toMatchDirSnapshot();
        });

        it("should ouput only 1 JSON file", async () => {
            const bundle = await rollup({
                experimentalCodeSplitting,

                input : [
                    find("simple.js"),
                    find("dependencies.js"),
                ],

                plugins : [
                    plugin({
                        cwd,
                        namer,
                        map,
                        json,
                    }),
                ],
            });

            await bundle.write({
                format,
                sourcemap,

                assetFileNames,
                chunkFileNames,

                dir : temp(),
            });

            expect(temp("assets")).toMatchDirSnapshot();
        });
    });
});
