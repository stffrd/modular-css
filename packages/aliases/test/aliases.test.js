"use strict";

const { dedent } = require("dentist");
    
const Processor = require("modular-css-core");
const namer = require("test-utils/namer.js");
const { find } = require("test-utils/fixtures.js");

const aliases = require("../aliases.js");

describe("modular-css-aliases", () => {
    it("should return a falsey value if a file isn't found", () => {
        const fn = aliases({
            aliases : {
                fixtures : "./fixtures",
            },
        });

        expect(fn(".", "fixtures/fooga.css")).toBeFalsy();
    });

    it("should return the absolute path if a file is found", () => {
        const fn = aliases({
            aliases : {
                one : find("one"),
            },
        });

        expect(fn(".", "one/one.css")).toBe(find("one.css"));
    });

    it("should check multiple aliases for files & return the first match", () => {
        const fn = aliases({
            aliases : {
                one : find("one"),
                two : find("two"),
                sub : find("one/sub"),
            },
        });

        expect(fn(".", "one/one.css")).toBe(find("one.css"));
        expect(fn(".", "sub/sub.css")).toBe(find("sub.css"));
    });

    it("should be usable as a modular-css resolver", async () => {
        const processor = new Processor({
            namer,
            resolvers : [
                aliases({
                    aliases : {
                        sub : find("sub"),
                        two : find("two"),
                    },
                }),
            ],
        });
        
        await processor.string(
            find("start.css"),
            dedent(`
                @value sub from "sub/sub.css";
                
                .rule {
                    composes: two from "two/two.css";
                }
            `)
        );

        const result = await processor.output();

        expect(result.compositions).toMatchSnapshot();
    });

    it("should fall through to the default resolver", async () => {
        const processor = new Processor({
            namer,
            resolvers : [
                aliases({
                    aliases : {
                        two : find("two"),
                    },
                }),
            ],
        });
        
        await processor.string(
            find("one.css"),
            dedent(`
                @value sub from "./sub/sub.css";
                
                .rule {
                    composes: two from "two/two.css";
                }
            `)
        );

        const result = await processor.output();

        expect(result.compositions).toMatchSnapshot();
    });
});
