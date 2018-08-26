/* eslint max-statements: "off" */
"use strict";

const fs = require("fs");

const { rollup } = require("rollup");

const dedent = require("dedent");
const shell = require("shelljs");

const namer = require("test-utils/namer.js");
const { temp, find, copy } = require("test-utils/fixtures.js");

require("test-utils/expect-file-snapshot.js");
require("test-utils/expect-dir-snapshot.js");
require("test-utils/expect-file-exists.js");

const Processor = require("modular-css-core");

const plugin = require("../rollup.js");

const error = (root) => {
    throw root.error("boom");
};

error.postcssPlugin = "error-plugin";

const assetFileNames = "assets/[name][extname]";
const format = "es";
const map = false;
const sourcemap = false;

describe("/rollup.js", () => {
    it("should be a function", () =>
        expect(typeof plugin).toBe("function")
    );
    
    it("should generate exports", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });
        
        const result = await bundle.generate({ format });
        
        expect(result.code).toMatchSnapshot();
    });
    
    it("should be able to tree-shake results", async () => {
        const bundle = await rollup({
            input   : find("tree-shaking.js"),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });

        const result = await bundle.generate({ format });
        
        expect(result.code).toMatchSnapshot();
    });

    it("should generate CSS", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    map,
                }),
            ],
        });

        await bundle.write({
            format,
            assetFileNames,
            file : temp("simple.js"),
        });

        expect(temp("assets/simple.css")).toMatchFileSnapshot();
    });

    it("should handle assetFileNames being undefined", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    map,
                }),
            ],
        });

        await bundle.write({
            format,
            file : temp("simple.js"),
        });

        const [ css ] = shell.ls(temp("assets"));

        expect(temp("assets", css)).toMatchFileSnapshot();
    });
    
    it("should correctly pass to/from params for relative paths", async () => {
        // Copy fixture to temp first so paths are sane and machine-independent
        copy("relative-paths", temp());

        const bundle = await rollup({
            input   : temp("relative-paths.js"),
            plugins : [
                plugin({
                    namer,
                    map,

                    // Need to adjust plugin cwd so relative paths are correct
                    cwd : temp(),
                }),
            ],
        });

        await bundle.write({
            format,
            assetFileNames,
            file : temp("dist/output.js"),
        });

        expect(temp("dist/assets/output.css")).toMatchFileSnapshot();
    });

    it("should avoid generating empty CSS", async () => {
        const bundle = await rollup({
            input   : find("no-css.js"),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });

        await bundle.write({
            format,
            assetFileNames,
            file : temp("no-css.js"),
        });

        expect(temp("assets/no-css.css")).not.fileExists();
    });

    it("should generate JSON", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    json : true,
                }),
            ],
        });
        
        await bundle.write({
            format,
            assetFileNames,
            file : temp("simple.js"),
        });
        
        expect(temp("assets/exports.json")).toMatchFileSnapshot();
    });
    
    it("should generate JSON with a custom name", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    json : "custom.json",
                }),
            ],
        });
        
        await bundle.write({
            format,
            assetFileNames,
            file : temp("simple.js"),
        });
        
        expect(temp("assets/custom.json")).toMatchFileSnapshot();
    });

    it("should provide named exports", async () => {
        const bundle = await rollup({
            input   : find("named.js"),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });

        const result = await bundle.generate({ format });

        expect(result.code).toMatchSnapshot();
    });

    it("should provide style export", async () => {
        const bundle = await rollup({
            input   : find("style-export.js"),
            plugins : [
                plugin({
                    namer,
                    styleExport : true,
                }),
            ],
        });

        const result = await bundle.generate({ format });

        expect(result.code).toMatchSnapshot();
    });

    it("should warn that styleExport and done aren't compatible", async () => {
        const spy = jest.spyOn(global.console, "warn");

        spy.mockImplementation(() => { /* NO-OP */ });
        
        await rollup({
            input   : find("style-export.js"),
            plugins : [
                plugin({
                    namer,
                    styleExport : true,
                    done        : [
                        () => { /* NO OP */ },
                    ],
                }),
            ],
        });

        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls).toMatchSnapshot();
    });

    it("should generate external source maps", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    map : {
                        inline : false,
                    },
                }),
            ],
        });

        await bundle.write({
            format,
            assetFileNames,
            file : temp("simple.js"),
        });

        // temp("assets/custom.json")ropertyMaFiletcher can exclude the file property
        // since it is a hash value and changes constantly
        const outputmap = JSON.parse(fs.readFileSync(temp("assets/simple.css.map"), "utf8"));

        expect(outputmap).toMatchSnapshot({
            file    : expect.any(String),
            sources : expect.any(Array),
        });

        expect(temp("assets/simple.css")).toMatchFileSnapshot();
    });
    
    it("should warn & not export individual keys when they are not valid identifiers", async () => {
        const bundle = await rollup({
            input   : find("invalid-name.js"),
            onwarn  : (msg) => expect(msg).toMatchSnapshot({ id : expect.any(String) }),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });

        const result = await bundle.generate({
            format,
            assetFileNames,
        });

        expect(result.code).toMatchSnapshot();
    });

    it("should allow disabling of named exports", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    namedExports : false,
                }),
            ],
        });

        const result = await bundle.generate({
            format,
            assetFileNames,
        });

        expect(result.code).toMatchSnapshot();
    });
    
    it("shouldn't disable sourcemap generation", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    sourcemap : true,
                }),
            ],
        });

        const result = await bundle.generate({
            format,
            assetFileNames,

            sourcemap : true,
        });

        expect(result.map).toMatchSnapshot();
    });
    
    it("should not output sourcemaps when they are disabled", async () => {
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    namer,
                    map,
                }),
            ],
        });

        const source = await bundle.generate({
            format,
            assetFileNames,
            sourcemap,
        });

        expect(source.map).toBe(null);

        await bundle.write({
            assetFileNames,
            format,
            sourcemap,

            file : temp("no-maps.js"),
        });
        
        expect(temp("assets/no-maps.css")).toMatchFileSnapshot();
    });

    it("should respect the CSS dependency tree", async () => {
        const bundle = await rollup({
            input   : find("dependencies.js"),
            plugins : [
                plugin({
                    namer,
                    map,
                }),
            ],
        });

        await bundle.write({
            format,
            assetFileNames,
            sourcemap,

            file : temp("dependencies.js"),
        });

        expect(temp("dependencies.js")).toMatchFileSnapshot();
        expect(temp("assets/dependencies.css")).toMatchFileSnapshot();
    });
    
    it("should accept an existing processor instance", async () => {
        const processor = new Processor({
            namer,
            map,
        });

        await processor.string("./fixtures/fake.css", dedent(`
            .fake {
                color: yellow;
            }
        `));
        
        const bundle = await rollup({
            input   : find("simple.js"),
            plugins : [
                plugin({
                    processor,
                }),
            ],
        });

        await bundle.write({
            format,
            sourcemap,
            assetFileNames,
            
            file : temp("existing-processor.js"),
        });

        expect(temp("assets/existing-processor.css")).toMatchFileSnapshot();
    });

    // causes tests to run forever for some reason...
    it("shouldn't over-remove files from an existing processor instance", async () => {
        const processor = new Processor({
            namer,
            map,
        });

        await processor.file(find("repeated-references/b.css"));
        
        const bundle = await rollup({
            input   : find("repeated-references/a.js"),
            plugins : [
                plugin({
                    processor,
                }),
            ],
        });

        await bundle.write({
            format,
            sourcemap,
            assetFileNames,
            
            file : temp("repeated-references.js"),
        });

        expect(temp()).toMatchDirSnapshot();
    });

    describe("errors", () => {
        it("should throw errors in in before plugins", async () => {
            expect.hasAssertions();

            try {
                await rollup({
                    input   : find("simple.js"),
                    plugins : [
                        plugin({
                            namer,
                            before : [ error ],
                        }),
                    ],
                });
            } catch(e) {
                expect(e.toString()).toMatch("error-plugin:");
            }
        });

        it("should throw errors in after plugins", async () => {
            expect.hasAssertions();
            
            const bundle = await rollup({
                input   : find("simple.js"),
                plugins : [
                    plugin({
                        namer,
                        after : [ error ],
                    }),
                ],
            });
            
            try {
                await bundle.generate({
                    format,
                    file : temp("error.js"),
                });
            } catch(e) {
                expect(e.toString()).toMatch("error-plugin:");
            }
        });
        
        it("should throw errors in done plugins", async () => {
            expect.hasAssertions();
            
            const bundle = await rollup({
                input   : find("simple.js"),
                plugins : [
                    plugin({
                        namer,
                        done : [ error ],
                    }),
                ],
            });
            
            try {
                await bundle.generate({
                    format,
                    file : temp("error.js"),
                });
            } catch(e) {
                expect(e.toString()).toMatch("error-plugin:");
            }
        });
    });
});
