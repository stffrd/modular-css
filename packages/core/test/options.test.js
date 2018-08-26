"use strict";

const path = require("path");

const dedent   = require("dedent");
const namer    = require("test-utils/namer.js");
const relative = require("test-utils/relative.js");
const { find } = require("test-utils/fixtures.js");

const Processor = require("../processor.js");

const sync = (css) => css.append({ selector : "a" });

const async = (css) => (
    new Promise((resolve) =>
        setTimeout(() => {
            sync(css);

            resolve();
        }, 0)
    )
);

describe("/processor.js", () => {
    describe("options", () => {
        describe("cwd", () => {
            it("should use an absolute path", async () => {
                const cwd = find("folder");
                const processor = new Processor({ cwd });
                
                const result = await processor.file("./folder.css");

                expect(processor.options.cwd).toBe(cwd);
                expect(result.file).toBe(find("folder.css"));
            });

            it("should accept a relative path but make it absolute", async () => {
                const cwd = path.relative(process.cwd(), find("folder"));
                const processor = new Processor({ cwd });
                
                const result = await processor.file("./folder.css");

                expect(processor.options.cwd).toBe(path.resolve(cwd));
                expect(result.file).toBe(find("folder.css"));
            });
        });

        describe("namer", () => {
            it("should use a custom naming function", async () => {
                const processor = new Processor({
                    namer : (filename, selector) =>
                        `${relative([ filename ])[0].replace(/[\/\.]/g, "_")}_${selector}`,
                });
                    
                const result = await processor.string(
                    "./packages/core/test/fixtures/simple.css",
                    ".wooga { }"
                );

                expect(result.exports).toMatchSnapshot();
                expect(result.details.text).toMatchSnapshot();
                expect(result.details.exports).toMatchSnapshot();
                expect(result.details.processed.root.toResult().css).toMatchSnapshot();
            });

            it("should require a namer if a string is passed", async () => {
                const processor = new Processor({
                    namer : "modular-css-namer",
                });
                    
                const result = await processor.string(
                    "./test/fixtures/simple.css",
                    ".wooga { }"
                );
                
                expect(result.exports).toMatchSnapshot();
            });

            it("should use the default naming function if a non-function is passed", async () => {
                const processor = new Processor({
                    namer : false,
                });
                    
                const result = await processor.string(
                    "./packages/core/test/fixtures/simple.css",
                    ".wooga { }"
                );
                
                expect(result.exports).toMatchSnapshot();
            });
        });

        describe("map", () => {
            it("should generate source maps", async () => {
                const processor = new Processor({
                    namer,
                    map : true,
                });
                
                await processor.file(find("start.css"));
                    
                const result = await processor.output({
                    from : "packages/core/test/fixtures/rewrite.css",
                    to   : "out.css",
                });

                expect(result.css).toMatchSnapshot();
            });

            it("should generate external source maps", async () => {
                const processor = new Processor({
                    namer,
                    map : {
                        internal : false,
                    },
                });
                
                await processor.file(find("start.css"));
                const result = await processor.output({
                    from : "packages/core/test/fixtures/rewrite.css",
                    to   : "out.css",
                });

                expect(result.css).toMatchSnapshot();
            });
        });

        describe("exportGlobals", () => {
            it("should not export :global values when exportGlobals is false", async () => {
                const processor = new Processor({
                    exportGlobals : false,
                });
                
                const result = await processor.string(
                    "./exportGlobals.css",
                    dedent(`
                        :global(.a) {}
                        .b {}
                    `)
                );

                expect(result.exports).toMatchSnapshot();
            });
        });

        describe("rewrite", () => {
            it("should rewrite url() references by default", async () => {
                const processor = new Processor();

                await processor.string(
                    "fixtures/rewrite.css",
                    dedent(`
                        .a {
                            background: url("img.png");
                        }
                    `)
                );

                const result = await processor.output({
                    from : "fixtures/rewrite.css",
                    to   : "output/rewrite.css",
                });
                
                expect(result.css).toMatchSnapshot();
            });

            it("should not rewrite url() references when falsey", async () => {
                const processor = new Processor({ rewrite : false });

                await processor.string(
                    "fixtures/rewrite.css",
                    dedent(`
                        .a {
                            background: url("img.png");
                        }
                    `)
                );

                const result = await processor.output({
                    from : "fixtures/rewrite.css",
                    to   : "./output/rewrite.css",
                });
                
                expect(result.css).toMatchSnapshot();
            });
            
            it("should pass through to postcss-url as config", async () => {
                const processor = new Processor({
                    rewrite : {
                        url : "inline",
                    },
                });
                
                await processor.file(find("rewrite-data-uri.css"));

                const result = await processor.output({
                    from : "fixtures/rewrite.css",
                    to   : "./output/rewrite.css",
                });
                
                expect(result.css).toMatchSnapshot();
            });
        });

        describe("lifecycle options", () => {
            describe("before", () => {
                it("should run sync postcss plugins before processing", async () => {
                    const processor = new Processor({
                        namer,
                        before : [ sync ],
                    });
                    
                    await processor.string(
                        "fixtures/sync-before.css",
                        ""
                    );

                    const result = await processor.output({
                        from : "fixtures/sync-before.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });

                it("should run async postcss plugins before processing", async () => {
                    const processor = new Processor({
                        namer,
                        before : [ async ],
                    });
                    
                    await processor.string(
                        "fixtures/async-before.css",
                        ""
                    );

                    const result = await processor.output({
                        from : "fixtures/async-before.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });
            });

            describe("processing", () => {
                it("should run sync postcss plugins processing processing", async () => {
                    const processor = new Processor({
                        namer,
                        processing : [ sync ],
                    });

                    await processor.string(
                        "fixtures/sync-processing.css",
                        ""
                    );
                    
                    const result = await processor.output({
                        from : "fixtures/sync-processing.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });

                it("should run async postcss plugins processing processing", async () => {
                    const processor = new Processor({
                        namer,
                        processing : [ async ],
                    });

                    await processor.string(
                        "fixtures/async-processing.css",
                        ""
                    );
                    
                    const result = await processor.output({
                        from : "fixtures/async-processing.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });

                it("should include exports from 'modular-css-export' modules", async () => {
                    const processor = new Processor({
                        namer,
                        processing : [ (css, result) => {
                            result.messages.push({
                                plugin  : "modular-css-exporter",
                                exports : {
                                    a : true,
                                    b : false,
                                },
                            });
                        } ],
                    });

                    const file = await processor.string(
                        "fixtures/async-processing.css",
                        ""
                    );

                    expect(file.exports).toMatchSnapshot();
                });
            });
            
            describe("after", () => {
                it("should use postcss-url by default", async () => {
                    const processor = new Processor();

                    await processor.file(find("relative.css"));
                    
                    const result = await processor.output({
                        from : "fixtures/rewrite.css",
                        to   : "./output/relative.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });
                
                it("should run sync postcss plugins", async () => {
                    const processor = new Processor({
                        namer,
                        after : [ sync ],
                    });

                    await processor.file(find("relative.css"));
                    
                    const result = await processor.output({
                        from : "fixtures/rewrite.css",
                        to   : "./output/relative.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });
                
                it("should run async postcss plugins", async () => {
                    const processor = new Processor({
                        namer,
                        after : [ async ],
                    });

                    await processor.file(find("relative.css"));
                    
                    const result = await processor.output({
                        from : "fixtures/rewrite.css",
                        to   : "./output/relative.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });
            });
            
            describe("done", () => {
                it("should run sync postcss plugins done processing", async () => {
                    const processor = new Processor({
                        namer,
                        done : [ sync ],
                    });
                    
                    await processor.string(
                        "fixtures/sync-done.css",
                        ""
                    );

                    const result = await processor.output({
                        from : "fixtures/sync-done.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });
                
                it("should run async postcss plugins done processing", async () => {
                    const processor = new Processor({
                        namer,
                        done : [ async ],
                    });
                    
                    await processor.string(
                        "fixtures/async-done.css",
                        ""
                    );

                    const result = await processor.output({
                        from : "fixtures/async-done.css",
                    });

                    expect(result.css).toMatchSnapshot();
                });
            });
        });
    });
});
