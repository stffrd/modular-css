"use strict";

const dedent = require("dedent");

const namer  = require("test-utils/namer.js");
const { find } = require("test-utils/fixtures.js");
    
const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("composition", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                namer,
            });
        });

        it("should fail on invalid composes syntax", async () => {
            await expect(processor.string(
                "./invalid/value.css",
                ".a { composes: b from nowhere.css; }"
            )).rejects.toMatchObject({
                message : expect.stringContaining(`SyntaxError: Expected source but "n" found.`),
                plugin  : "modular-css-graph-nodes",
            });
        });
        
        it("should fail if a composition references a non-existant class", async () => {
            await expect(processor.string(
                "./invalid-composition.css",
                ".a { composes: b; }"
            )).rejects.toMatchObject({
                message : expect.stringContaining("Invalid composes reference"),
            });
        });
        
        it("should fail if a composition references a non-existant file", async () => {
            await expect(processor.string(
                "./invalid-composition.css",
                ".a { composes: b from \"../local.css\"; }"
            )).rejects.toMatchObject({
                message : expect.stringContaining(`Unable to locate "../local.css" from `),
            });
        });

        it("should fail if composes isn't the first property", async () => {
            await expect(processor.string(
                "./invalid/composes-first.css",
                dedent(`
                    .a { color: red; }
                    .b {
                        color: blue;
                        composes: a;
                    }
                `)
            )).rejects.toMatchObject({
                message : expect.stringContaining(`composes must be the first declaration`),
            });
        });

        it("should fail on rules that use multiple selectors", async () => {
            await expect(processor.string(
                "./invalid/composes-first.css",
                dedent(`
                    .a { color: red; }
                    .b .c { composes: a; }
                `)
            )).rejects.toMatchObject({
                message : expect.stringContaining(`Only simple singular selectors may use composition`),
            });
        });

        it("should compose a single class", async () => {
            await processor.string(
                "./single-composes.css",
                dedent(`
                    .a { color: red; }
                    .b { composes: a; }
                `)
            );

            const output = await processor.output();
            
            expect(output.compositions).toMatchSnapshot();
        });

        it("should allow comments before composes", async () => {
            await processor.string(
                "./multiple-composes.css",
                dedent(`
                    .a { color: red; }
                    .b {
                        /* comment */
                        composes: a;
                    }
                `)
            );

            const output = await processor.output();
            
            expect(output.compositions).toMatchSnapshot();
        });

        it("should compose from globals", async () => {
            await processor.string(
                "./global-compose.css",
                dedent(`
                    .a { composes: global(b); }
                `)
            );

            const output = await processor.output();
            
            expect(output.compositions).toMatchSnapshot();
        });

        it("should compose multiple classes", async () => {
            await processor.string(
                "./multiple-composes.css",
                dedent(`
                    .a { color: red; }
                    .b { color: blue; }
                    .c {
                        composes: a;
                        composes: b;
                    }
                `)
            );

            const output = await processor.output();
            
            expect(output.compositions).toMatchSnapshot();
        });
        
        it("should compose from other files", async () => {
            await processor.file(find("composes.css"));

            const output = await processor.output();

            expect(output.compositions).toMatchSnapshot();
        });
    });
});
