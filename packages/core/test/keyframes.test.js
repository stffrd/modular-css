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

        it("should leave unknown animation names alone", async () => {
            await processor.string(
                "./unknown-name.css",
                dedent(`
                    .a { animation: a; }
                    .b { animation-name: b; }
                `)
            );

            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });
        
        it("should update scoped animations from the scoping plugin's message", async () => {
            await processor.string(
                "./animation.css",
                dedent(`
                    @keyframes a {}
                    .b { animation: a; }
                `)
            );

            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should update the animation-name property", async () => {
            await processor.string(
                "./animation-name.css",
                dedent(`
                    @keyframes a {}
                    .b { animation-name: a; }
                `)
            );

            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        // Issue 208
        it("should update multiple animations properly", async () => {
            await processor.string(
                "./multiple-animations.css",
                dedent(`
                    @keyframes a {}
                    @keyframes b {}
                    .c { animation: a 10s linear, b 0.2s infinite; }
                `)
            );

            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });

        it("should update scoped prefixed animations from the scoping plugin's message", async () => {
            await processor.string(
                "./prefixed-animations.css",
                dedent(`
                    @-webkit-keyframes a {}
                    .b { animation: a; }
                `)
            );

            const result = await processor.output();
            
            expect(result.css).toMatchSnapshot();
        });
    });
});
