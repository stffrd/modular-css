/* eslint max-statements: "off" */
"use strict";

const fs = require("fs");
const path = require("path");

const { rollup } = require("rollup");

const tempy = require("tempy");
const dedent = require("dedent");
const shell = require("shelljs");

const namer = require("test-utils/namer.js");

require("test-utils/expect-file-snapshot.js");

const Processor = require("modular-css-core");

const plugin = require("../rollup.js");

function error(root) {
    throw root.error("boom");
}

error.postcssPlugin = "error-plugin";

const assetFileNames = "assets/[name][extname]";
const format = "es";
const map = false;
const sourcemap = false;

describe("/rollup.js", () => {
    let specimens;
    let dir;

    // TODO: not working correctly yet, seems like modular-css isn't actually
    // running against the moved specimen files?
    beforeAll(() => {
        const base = tempy.directory();

        shell.cp("-r", path.join(__dirname, "./specimens/*"), base);

        specimens = (...parts) => path.join(base, ...parts);
    });

    beforeEach(() => {
        const base = tempy.directory();

        dir = (...parts) => path.join(base, ...parts);
    });
    
    it("should be a function", () =>
        expect(typeof plugin).toBe("function")
    );
    
    it("should generate exports", async () => {
        const bundle = await rollup({
            input   : specimens("simple.js"),
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
            input   : specimens("tree-shaking.js"),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });

        const result = await bundle.generate({ format });
        
        expect(result.code).toMatchSnapshot();
    });

    it.only("should generate CSS", async () => {
        console.log(specimens("simple.js"));
        
        const bundle = await rollup({
            input   : specimens("simple.js"),
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
            file : dir("simple.js"),
        });

        expect(dir("assets/simple.css")).toMatchFileSnapshot();
    });

    it("should handle assetFileNames being undefined", async () => {
        const bundle = await rollup({
            input   : specimens("simple.js"),
            plugins : [
                plugin({
                    namer,
                    map,
                }),
            ],
        });

        await bundle.write({
            format,
            file : dir("simple.js"),
        });

        const [ css ] = shell.ls(dir("assets"));

        expect(dir("assets", css)).toMatchFileSnapshot();
    });
    
    it("should correctly pass to/from params for relative paths", async () => {
        const bundle = await rollup({
            input   : specimens("relative-paths.js"),
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
            file : dir("relative-paths.js"),
        });

        expect(dir("assets/relative-paths.css")).toMatchFileSnapshot();
    });

    it("should avoid generating empty CSS", async () => {
        const bundle = await rollup({
            input   : specimens("no-css.js"),
            plugins : [
                plugin({
                    namer,
                }),
            ],
        });

        await bundle.write({
            format,
            assetFileNames,
            file : dir("no-css.js"),
        });

        expect(fs.existsSync(dir("assets/no-css.css"))).toBe(false);
    });

    it("should generate JSON", async () => {
        const bundle = await rollup({
            input   : specimens("simple.js"),
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
            file : dir("simple.js"),
        });
        
        expect(dir("assets/exports.json")).toMatchFileSnapshot();
    });
    
    it("should generate JSON with a custom name", async () => {
        const bundle = await rollup({
            input   : specimens("simple.js"),
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
            file : dir("simple.js"),
        });
        
        expect(dir("assets/custom.json")).toMatchFileSnapshot();
    });

    it("should provide named exports", async () => {
        const bundle = await rollup({
            input   : specimens("named.js"),
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
            input   : specimens("style-export.js"),
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
            input   : specimens("style-export.js"),
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
            input   : specimens("simple.js"),
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
            file : dir("simple.js"),
        });

        // dir("assets/custom.json")ropertyMaFiletcher can exclude the file property
        // since it is a hash value and changes constantly
        const outputmap = JSON.parse(fs.readFileSync(dir("assets/simple.css.map"), "utf8"));

        expect(outputmap).toMatchSnapshot({
            file    : expect.any(String),
            sources : expect.any(Array),
        });

        expect(dir("assets/simple.css")).toMatchFileSnapshot();
    });
    
    it("should warn & not export individual keys when they are not valid identifiers", async () => {
        const bundle = await rollup({
            input   : specimens("invalid-name.js"),
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
            input   : specimens("simple.js"),
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
            input   : specimens("simple.js"),
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
            input   : specimens("simple.js"),
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

            file : dir("no-maps.js"),
        });
        
        expect(dir("assets/no-maps.css")).toMatchFileSnapshot();
    });

    it("should respect the CSS dependency tree", async () => {
        const bundle = await rollup({
            input   : specimens("dependencies.js"),
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

            file : dir("dependencies.js"),
        });

        expect(dir("dependencies.js")).toMatchFileSnapshot();
        expect(dir("assets/dependencies.css")).toMatchFileSnapshot();
    });
    
    it("should accept an existing processor instance", async () => {
        const processor = new Processor({
            namer,
            map,
        });

        await processor.string("./packages/rollup/test/specimens/fake.css", dedent(`
            .fake {
                color: yellow;
            }
        `));
        
        const bundle = await rollup({
            input   : specimens("simple.js"),
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
            
            file : dir("existing-processor.js"),
        });

        expect(dir("assets/existing-processor.css")).toMatchFileSnapshot();
    });

    it("shouldn't over-remove files from an existing processor instance", async () => {
        const processor = new Processor({
            namer,
            map,
        });

        await processor.file(specimens("repeated-references/b.css"));
        
        const bundle = await rollup({
            input   : specimens("repeated-references/a.js"),
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
            
            file : dir("repeated-references.js"),
        });

        expect(dir("repeated-references.js")).toMatchFileSnapshot();
        expect(dir("assets/repeated-references.css")).toMatchFileSnapshot();
    });

    describe("errors", () => {
        function checkError(err) {
            expect(err.toString()).toMatch("error-plugin:");
        }

        it("should throw errors in in before plugins", () =>
            rollup({
                input   : specimens("simple.js"),
                plugins : [
                    plugin({
                        namer,
                        css    : dir("errors.css"),
                        before : [ error ],
                    }),
                ],
            })
            .catch(checkError)
        );

        it("should throw errors in after plugins", () =>
            rollup({
                input   : specimens("simple.js"),
                plugins : [
                    plugin({
                        namer,
                        css   : dir("errors.css"),
                        after : [ error ],
                    }),
                ],
            })
            .catch(checkError)
        );

        // Skipped because I can't figure out how to catch the error being thrown?
        it.skip("should throw errors in done plugins", () =>
            rollup({
                input   : specimens("simple.js"),
                plugins : [
                    plugin({
                        namer,
                        css  : dir("errors.css"),
                        done : [ error ],
                    }),
                ],
            })
            .then((bundle) => bundle.write({
                format,
                file : dir("simple.js"),
            }))
        );
    });
});
