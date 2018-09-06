"use strict";

const dedent = require("dedent");
const namer  = require("test-utils/namer.js");
const { cwd, find } = require("test-utils/fixtures.js");

const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("exports", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                cwd,
                namer,
            });
        });
        
        it("should export an object of arrays containing strings", async () => {
            const result = await processor.string(
                "./simple.css",
                dedent(`
                    .red { color: red; }
                    .black { background: #000; }
                    .one, .two { composes: red, black; }
                `)
            );

            expect(result.exports).toMatchSnapshot();
        });

        it("should export identifiers and their classes", async () => {
            await processor.file(find("start.css"));
            
            const output = await processor.output();
            
            expect(output.compositions).toMatchSnapshot();
        });
    });
});
