"use strict";

const dedent = require("dedent");
const namer  = require("test-utils/namer.js");
    
const Processor = require("../../processor.js");

describe("/issues", () => {
    describe("/98", () => {
        it("should prune rules that only compose, but leave them in the exports", async () => {
            const processor = new Processor({
                namer,
            });
            
            const result = await processor.string(
                "./fixtures/issues/98.css",
                dedent(`
                    .booga { color: red }
                    .fooga { composes: booga }
                    .fooga + .fooga { color: blue }
                `)
            );

            expect(result.exports).toMatchSnapshot();

            const output = await processor.output();
            
            expect(output.css).toMatchSnapshot();
        });
    });
});
