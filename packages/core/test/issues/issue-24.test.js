"use strict";

const dedent = require("dedent");
const namer  = require("test-utils/namer.js");

const Processor = require("../../processor.js");

describe("/issues", () => {
    describe("/24", () => {
        it("should be able to compose using a value", async () => {
            const processor = new Processor({
                namer,
            });
            
            const result = await processor.string(
                "fixtures/composition.css",
                dedent(`
                    @value simple: "./simple.css";
                    
                    .a {
                        composes: fooga from simple;
                        background: #000;
                    }
                `)
            );

            expect(result.exports).toMatchSnapshot();

            const output = await processor.output();
            
            expect(output.css).toMatchSnapshot();
        });
    });
});
