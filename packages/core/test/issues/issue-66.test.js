"use strict";

const Processor = require("../../processor.js");

describe("/issues", () => {
    describe("/66", () => {
        it("should ignore remove calls for unknown files", async () => {
            const processor = new Processor();

            await processor.string(
                "./specimens/a.css",
                ".aooga { }"
            );
            
            expect(() => processor.remove("./fooga.js")).not.toThrow();
        });
    });
});
