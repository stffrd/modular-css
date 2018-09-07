"use strict";

const fs = require("fs");
    
const postcss = require("postcss");
const namer = require("test-utils/namer.js");
const { cwd, find, temp, read } = require("test-utils/fixtures.js");

require("test-utils/expect-file-snapshot.js");

const plugin  = require("../postcss.js");

const process = (file, opts = {}) =>
    plugin.process(
        fs.readFileSync(file),
        Object.assign(
            Object.create(null),
            {
                from : file,
                cwd,
                namer,
            },
            opts
        )
    );

describe("/postcss.js", () => {
    it("should be a function", () => {
        expect(typeof plugin).toBe("function");
    });

    it("should process CSS and output the result", async () => {
        const result = await process(find("simple.css"));
        
        expect(result.css).toMatchSnapshot();
    });

    it("should process CSS with dependencies and output the result", async () => {
        const result = await process(find("start.css"));
        
        expect(result.css).toMatchSnapshot();
    });

    it("should process CSS and output exports as a message", async () => {
        const result = await process(find("simple.css"));
        
        expect(result.messages).toMatchSnapshot();
    });

    it("should accept normal processor options", async () => {
        const result = await process(find("simple.css"), {
            map : {
                inline : true,
            },
            namer : (f, s) => `fooga_${s}`,
        });

        expect(result.css).toMatchSnapshot();
    });

    it("should accept a `json` property and write exports to that file", async () => {
        await process(find("start.css"), {
            json : temp("classes.json"),
        });
        
        expect(temp("classes.json")).toMatchFileSnapshot();
    });

    it("should use output filepath for json if a custom path isn't provided", async () => {
        await process(find("start.css"), {
            json : true,
            to   : temp("start.css"),
        });
        
        expect(temp("start.json")).toMatchFileSnapshot();
    });

    it("should be usable like a normal postcss plugin", async () => {
        const processor = postcss([
            plugin({
                cwd,
                namer : () => "a",
            }),
        ]);
        
        const result = await processor.process(read("simple.css"), {
            from : find("simple.css"),
            map  : {
                inline : true,
            },
        });

        expect(result.css).toMatchSnapshot();
    });

    it("should output json when used within postcss", async () => {
        const processor = postcss([
            plugin({
                cwd,
                namer,
            }),
        ]);
        
        await processor.process(read("simple.css"), {
            from : find("simple.css"),
            json : temp("simple.json"),
        });

        expect(temp("simple.json")).toMatchFileSnapshot();
    });

    it("should accept json args in either position with postcss", async () => {
        var processor = postcss([
            plugin({
                cwd,
                namer,
                json : temp("simple.json"),
            }),
        ]);
        
        await processor.process(read("simple.css"), {
            from : find("simple.css"),
        });
        
        expect(temp("simple.json")).toMatchFileSnapshot();
    });
});
