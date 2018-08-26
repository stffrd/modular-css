"use strict";

const namer = require("test-utils/namer.js");

const glob = require("../glob.js");

describe("/glob.js", () => {
    it("should be a function", () => {
        expect(typeof glob).toBe("function");
    });

    it("should use a default search", async () => {
        const processor = await glob({
            namer,
            cwd : "./fixtures/glob",
        });

        const output = await processor.output();

        expect(output.css).toMatchSnapshot();
    });

    it("should find files on disk & output css", async () => {
        const processor = await glob({
            namer,
            cwd    : "./fixtures/glob",
            search : [
                "**/*.css",
            ],
        });

        const output = await processor.output();

        expect(output.css).toMatchSnapshot();
    });

    it("should support exclusion patterns", async () => {
        const processor = await glob({
            namer,
            cwd    : "./fixtures/glob",
            search : [
                "**/*.css",
                "!**/exclude/**",
            ],
        });

        const output = await processor.output();

        expect(output.css).toMatchSnapshot();
    });
});
