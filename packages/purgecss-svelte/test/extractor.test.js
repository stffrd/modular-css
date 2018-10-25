"use strict";

const Purgecss = require("purgecss");
const dedent = require("dedent");

const extractor = require("../extractor.js");

describe("purgecss", () => {
    it("should properly remove unused classes", () => {
        const purger = new Purgecss({
            content : [{
                raw : dedent(`
                    <h1 class="{css.title}">Title</h1>
                `),
                extension : "html",
            }],

            css : [{
                raw : dedent(`
                    .title {
                        color: red;
                    }

                    .unused {
                        background: blue;
                    }
                `),
            }],

            extractors : [{
                extractor,
                extensions : [ "html" ],
            }],
        });

        const result = purger.purge();

        expect(result).toMatchSnapshot();
    });

    it.skip("should understand composes references", () => {
        const purger = new Purgecss({
            content : [{
                raw : dedent(`
                    <h1 class="{css.title}">Title</h1>
                `),
                extension : "html",
            }],

            css : [{
                raw : dedent(`
                    .title {
                        color: red;
                    }

                    .unused {
                        background: blue;
                    }
                `),
            }],

            extractors : [{
                extractor,
                extensions : [ "html" ],
            }],
        });

        const result = purger.purge();

        expect(result).toMatchSnapshot();
    });
});
