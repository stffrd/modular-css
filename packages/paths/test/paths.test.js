"use strict";

const dedent = require("dedent");
    
const Processor = require("modular-css-core");
const namer = require("test-utils/namer.js");
const { find } = require("test-utils/fixtures.js");

const paths = require("../paths.js");

describe("modular-css-paths", () => {
    it("should return a falsey value if a file isn't found", () => {
        const fn = paths({
            paths : [
                "./fixtures",
            ],
        });

        expect(fn(".", "./fooga.css")).toBeFalsy();
    });

    it("should return the absolute path if a file is found", () => {
        const fn = paths({
            paths : [
                "./fixtures/one",
            ],
        });

        expect(fn(".", "./one.css")).toBe(find("one.css"));
    });

    it("should check multiple paths for files & return the first match", () => {
        const fn = paths({
            paths : [
                "./fixtures/one",
                "./fixtures/one/sub",
            ],
        });

         expect(fn(".", "./sub.css")).toBe(find("sub.css"));
    });

    it("should be usable as a modular-css resolver", async () => {
        const processor = new Processor({
            namer,
            resolvers : [
                paths({
                    paths : [
                        "./fixtures/one/sub",
                        "./fixtures/two",
                    ],
                }),
            ],
        });
        
        await processor.string(
            "./fixtures/one/start.css",
            dedent(`
                @value sub from "./sub.css";
                
                .rule {
                    composes: two from "./two.css";
                }
            `)
        );

        const result = await processor.output();
        
        expect(result.compositions).toMatchSnapshot();
    });
});
