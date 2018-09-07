"use strict";

const dedent = require("dedent");
    
const Processor = require("modular-css-core");
const namer = require("test-utils/namer.js");
const { cwd, find } = require("test-utils/fixtures.js");

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
                find("one"),
            ],
        });

        expect(fn(".", "./one.css")).toBe(find("one.css"));
    });

    it("should check multiple paths for files & return the first match", () => {
        const fn = paths({
            paths : [
                find("one"),
                find("sub"),
            ],
        });

         expect(fn(".", "./sub.css")).toBe(find("sub.css"));
    });

    it("should be usable as a modular-css resolver", async () => {
        const processor = new Processor({
            cwd,
            namer,
            resolvers : [
                paths({
                    paths : [
                        find("sub"),
                        find("two"),
                    ],
                }),
            ],
        });
        
        await processor.string(
            "./one/start.css",
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
