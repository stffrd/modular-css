"use strict";

const fs = require("fs");
    
const namer = require("test-utils/namer.js");
const { find, temp } = require("test-utils/fixtures.js");

const Processor = require("../../processor.js");

describe("/issues", () => {
    describe("/191", () => {
        var fn = it;
        
        // Verify that filesystem is case-insensitive before bothering
        fs.writeFileSync(temp("sensitive.txt"));

        try {
            fs.statSync(temp("SENSITIVE.txt"));
        } catch(e) {
            fn = it.skip;
        }

        fn("should ignore case differences in file paths", async () => {
            const processor = new Processor({
                namer,
            });
            
            await processor.file(find("191.css"));

            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });
    });
});
