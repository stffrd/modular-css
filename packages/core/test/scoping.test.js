"use strict";

const dedent = require("dedent");
const namer  = require("test-utils/namer.js");

const Processor = require("../processor.js");

describe("/processor.js", () => {
    describe("scoping", () => {
        var processor;
        
        beforeEach(() => {
            processor = new Processor({
                namer,
            });
        });

        it("should scope classes, ids, and keyframes", async () => {
            const result = await processor.string(
                "./simple.css",
                dedent(`
                    @keyframes kooga { }
                    #fooga { }
                    .wooga { }
                    .one,
                    .two { }
                `)
            );

            expect(result.exports).toMatchSnapshot();

            const output = await processor.output();

            expect(output.css).toMatchSnapshot();
        });

        it("should handle pseudo classes correctly", async () => {
            const result = await processor.string(
                "./simple.css",
                dedent(`
                    :global(.g1) {}
                    .b :global(.g2) {}
                    :global(#c) {}
                    .d:hover {}
                    .e:not(.e) {}
                `)
            );

            expect(result.exports).toMatchSnapshot();

            const output = await processor.output();
            
            expect(output.css).toMatchSnapshot();
        });

        it("should not allow :global classes to overlap with local ones (local before global)", async () => {
            await expect(processor.string(
                "./invalid/global.css",
                dedent(`
                    .a {}
                    :global(.a) {}
                `)
            )).rejects.toMatchObject({
                message : expect.stringContaining(`Unable to re-use the same selector for global & local`),
            });
        });

        it("should not allow :global classes to overlap with local ones (global before local)", async () => {
            await expect(processor.string(
                "./invalid/global.css",
                dedent(`
                    :global(.a) {}
                    .a {}
                `)
            )).rejects.toMatchObject({
                message : expect.stringContaining(`Unable to re-use the same selector for global & local`),
            });
        });

        it("should not allow empty :global() selectors", async () => {
            await expect(processor.string(
                "./invalid/global.css",
                ".a :global() { }"
            )).rejects.toMatchObject({
                message : expect.stringContaining(`:global(...) must not be empty`),
            });
        });
    });
});
