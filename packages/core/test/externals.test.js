"use strict";

const dedent = require("dedent");
const namer  = require("test-utils/namer.js");
const { find, cwd } = require("test-utils/fixtures.js");

const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("externals", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                namer,
                cwd,
            });
        });
        
        it("should fail if not a valid composition reference", async () => {
            await expect(processor.string(
                "./invalid-external.css",
                dedent(`
                    :external(some garbage here) { }
                `)
            )).rejects.toMatchObject({
                message : expect.stringContaining(`SyntaxError: Expected`),
            });
        });

        it("should fail if not referencing another file", async () => {
            await expect(processor.string(
                "./invalid-external.css",
                dedent(`
                    :external(a) { }
                `)
            )).rejects.toMatchObject({
                message : expect.stringContaining(`externals must be from another file`),
            });
        });

        it("should fail on bad class references", async () => {
            await expect(processor.file(find("externals-invalid.css"))).rejects.toMatchObject({
                message : expect.stringContaining(`Invalid external reference: nopenopenope`),
            });
        });
        
        it("should support overriding external values", async () => {
            await processor.file(find("externals.css"));
                
            const result = await processor.output();
            

            expect(result.css).toMatchSnapshot();
        });
    });
});
