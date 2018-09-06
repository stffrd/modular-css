"use strict";

const dedent = require("dedent");
const namer = require("test-utils/namer.js");
const { find, cwd } = require("test-utils/fixtures.js");

const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("values", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                cwd,
                namer,
            });
        });
        
        it("should fail on invalid value syntax", async () => {
            await expect(processor.string(
                "./invalid/value.css",
                "@value foo, bar from nowhere.css"
            )).rejects.toMatchObject({
                message : expect.stringContaining(`SyntaxError: Expected source but "n" found.`),
            });
        });

        it("should fail if a value imports a non-existant reference", async () => {
            await expect(processor.string(
                "./invalid/value.css",
                "@value not-real from \"../local.css\";"
            )).rejects.toMatchObject({
                message : expect.stringContaining(`Unable to locate "../local.css" from `),
            });
        });

        it("should support simple values", async () => {
            await processor.string(
                find("values.css"),
                dedent(`
                    @value a: red;
                    @value b:
                        Segoe UI
                        sans-serif;

                    .a {
                        color: a;
                        font-family: b;
                    }
                `)
            );
            
            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should support local values in value composition", async () => {
            const result = await processor.string(
                find("simple.css"),
                dedent(`
                    @value o: one;
                    @value local: './local.css';
                    @value o from local;
                    .fooga { background: one; }
                `)
            );

            expect(result.exports).toMatchSnapshot();
        });

        it("should support importing variables from a file", async () => {
            await processor.file(find("value-import.css"));
            
            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should support exporting imported variables", async () => {
            await processor.file(find("value-export.css"));
            
            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should support value composition", async () => {
            await processor.file(find("value-composition.css"));
            
            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should support value namespaces", async () => {
            await processor.file(find("value-namespace.css"));
            
            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should support value replacement in :external(...)", async () => {
            await processor.file(find("externals.css"));
            
            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });
    });
});
