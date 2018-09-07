"use strict";

const fs = require("fs");

const svelte = require("svelte");
const dedent = require("dedent");

const namer = require("test-utils/namer.js");
const { cwd, find, read, temp, write } = require("test-utils/fixtures.js");
    
const plugin = require("../svelte.js");

describe("/svelte.js", () => {
    it("should extract CSS from a <style> tag", async () => {
        const { processor, preprocess } = plugin({
            namer,
            cwd,
        });
        
        const processed = await svelte.preprocess(
            read("style.html"),
            Object.assign({}, preprocess, { filename : find("style.html") })
        );

        expect(processed.toString()).toMatchSnapshot();

        const output = await processor.output();
        
        expect(output.css).toMatchSnapshot();
    });

    it.each`
        fixture | title
        ${"external.html"} | ${"no script"}
        ${"external-script.html"} | ${"existing script"}
        ${"external-single.html"} | ${"single quotes"}
        ${"external-unquoted.html"} | ${"unquoted"}
    `("should extract CSS from a <link> tag ($title)", async ({ fixture }) => {
        const { processor, preprocess } = plugin({
            namer,
            cwd,
        });

        const processed = await svelte.preprocess(
            read(fixture),
            Object.assign({}, preprocess, { filename : find(fixture) })
        );

        expect(processed.toString()).toMatchSnapshot();

        const output = await processor.output();
        
        expect(output.css).toMatchSnapshot();
    });

    it("should ignore files without <style> blocks", async () => {
        const { processor, preprocess } = plugin({
            cwd,
        });

        const processed = await svelte.preprocess(
            dedent(`
                <h1>Hello</h1>
                <script>console.log("output")</script>
            `),
            preprocess
        );

        expect(processed.toString()).toMatchSnapshot();
            
        const output = await processor.output();
       
        expect(output.css).toMatchSnapshot();
    });

    it.each`
        title         | inline   | strict   | fixture
        ${"<script>"} | ${true}  | ${true}  | ${"invalid-inline-script.html"}
        ${"template"} | ${true}  | ${true}  | ${"invalid-inline-template.html"}
        ${"<script>"} | ${true}  | ${false} | ${"invalid-inline-script.html"}
        ${"template"} | ${true}  | ${false} | ${"invalid-inline-template.html"}
        ${"<script>"} | ${false} | ${false} | ${"invalid-external-script.html"}
        ${"template"} | ${false} | ${false} | ${"invalid-external-template.html"}
        ${"<script>"} | ${false} | ${true}  | ${"invalid-external-script.html"}
        ${"template"} | ${false} | ${true}  | ${"invalid-external-template.html"}
    `("should handle invalid references in $title (inline: $inline, strict: $strict)", async ({ strict, fixture }) => {
        const spy = jest.spyOn(global.console, "warn");

        spy.mockImplementation(() => { /* NO-OP */ });
        
        const { preprocess } = plugin({
            namer,
            strict,
            cwd,
        });
        
        if(strict) {
            await expect(
                svelte.preprocess(
                    read(fixture),
                    Object.assign({}, preprocess, { filename : find(fixture) })
                )
            ).rejects.toThrowErrorMatchingSnapshot();

            return;
        }

        const processed = await svelte.preprocess(
            read(fixture),
            Object.assign({}, preprocess, { filename : find(fixture) })
        );
        
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls).toMatchSnapshot();

        expect(processed.toString()).toMatchSnapshot();
    });

    it("should throw on both <style> and <link> in one file", async () => {
        const { preprocess } = plugin({
            css : "./output/svelte.css",
            namer,
            cwd,
        });

        await expect(
            svelte.preprocess(
                read("both.html"),
                Object.assign({}, preprocess, { filename : find("both.html") })
            )
        ).rejects.toThrowErrorMatchingSnapshot();
    });

    it("should remove files before reprocessing in case they changed", async () => {
        // V1 of files
        write("source.html", dedent(`
            <link rel="stylesheet" href="./source.css" />
            <div class="{css.source}">Source</div>
        `));

        write("source.css", dedent(`
            .source {
                color: red;
            }
        `));
        
        const { processor, preprocess } = plugin({
            namer,
            cwd : temp(),
        });

        let processed = await svelte.preprocess(
            // Can't use read here, needs to read the output,
            fs.readFileSync(temp("source.html"), "utf8"),
            Object.assign({}, preprocess, { filename : temp("source.html") })
        );

        expect(processed.toString()).toMatchSnapshot();

        let output = await processor.output();

        expect(output.css).toMatchSnapshot();
        
        // V2 of CSS
        write("source.css", dedent(`
            .source {
                color: blue;
            }
        `));
        
        processed = await svelte.preprocess(
            // Can't use read here, needs to read the output,
            fs.readFileSync(temp("source.html"), "utf8"),
            Object.assign({}, preprocess, { filename : temp("source.html") })
        );

        expect(processed.toString()).toMatchSnapshot();

        output = await processor.output();

        expect(output.css).toMatchSnapshot();
    });
});
