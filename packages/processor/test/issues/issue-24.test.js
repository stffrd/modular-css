"use strict";

var dedent = require("dedent"),
    namer  = require("@modular-css/test-utils/namer.js"),

    Processor = require("../../processor.js");

describe("/issues", () => {
    describe("/24", () => {
        it("should be able to compose using a value", () => {
            var processor = new Processor({
                    namer,
                });
            
            return processor.string(
                "./packages/processor/test/specimens/composition.css",
                dedent(`
                    @value simple: "./simple.css";
                    
                    .a {
                        composes: wooga from simple;
                        background: #000;
                    }
                `)
            )
            .then((result) => {
                expect(result.exports).toMatchSnapshot();

                return processor.output();
            })
            .then((result) => expect(result.css).toMatchSnapshot());
        });
    });
});
