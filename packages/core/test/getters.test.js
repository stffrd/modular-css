"use strict";

const namer = require("test-utils/namer.js");
const { find, cwd, relative } = require("test-utils/fixtures.js");

const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("getters", () => {
        let processor;
        
        beforeEach(() => {
            processor = new Processor({
                namer,
                cwd,
            });
        });
        
        describe(".file", () => {
            it("should return all the files that have been added", async () => {
                await processor.file(find("start.css"));
                await processor.file(find("local.css"));

                const files = Object.keys(processor.files);
                
                expect(files.map(relative)).toMatchSnapshot();
            });
        });

        describe(".options", () => {
            it("should return the merged options object", () => {
                expect(typeof processor.options).toBe("object");
            });
        });
    });
});
