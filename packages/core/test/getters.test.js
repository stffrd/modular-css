"use strict";

const namer    = require("test-utils/namer.js");
const relative = require("test-utils/relative.js");
const { find } = require("test-utils/fixtures.js");

const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("getters", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                namer,
            });
        });
        
        describe(".file", () => {
            it("should return all the files that have been added", async () => {
                await processor.file(find("start.css"));
                await processor.file(find("local.css"));
                
                expect(
                    relative(Object.keys(processor.files))
                )
                .toMatchSnapshot();
            });
        });

        describe(".options", () => {
            it("should return the merged options object", () => {
                expect(typeof processor.options).toBe("object");
            });
        });
    });
});
