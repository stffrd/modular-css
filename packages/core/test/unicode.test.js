"use strict";

const namer = require("test-utils/namer.js");
const { find } = require("test-utils/fixtures.js");
    
const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("unicode", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                namer,
            });
        });

        it("should support unicode classes & ids", async () => {
            await processor.file(find("unicode.css"));
                
            const output = await processor.output({
                to : "./output/unicode.css",
            });

            expect(output.css).toMatchSnapshot();
        });
    });
});
