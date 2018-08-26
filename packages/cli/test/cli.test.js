"use strict";

const tester = require("cli-tester");

const { temp } = require("test-utils/fixtures.js");

require("test-utils/expect-file-snapshot.js");

const cli = require.resolve("../cli.js");

describe("/cli.js", () => {
    it("should show help with no args", async () => {
        const out = await tester(
            cli,
        );

        expect(out.code).toBe(2);
        expect(out.stdout).toMatchSnapshot();
    });

    it("should default to outputting to stdout", async () => {
        const out = await tester(
            cli,
            "fixtures/simple.css",
        );

        expect(out.code).toBe(0);
        expect(out.stdout).toMatchSnapshot();
    });

    it("should support outputting to a file (--out)", async () => {
        const out = await tester(
            cli,
            `--out=${temp("simple.css")}`,
            "fixtures/simple.css",
        );

        expect(out.code).toBe(0);
        expect(temp("simple.css")).toMatchFileSnapshot();
    });

    it("should support outputting compositions to a file (--json)", async () => {
        const out = await tester(
            cli,
            `--json=${temp("classes.json")}`,
            "fixtures/simple.css",
        );

        expect(out.code).toBe(0);
        expect(temp("classes.json")).toMatchFileSnapshot();
    });

    it("should return the correct error code on invalid CSS", async () => {
        const out = await tester(
            cli,
            "fixtures/invalid.css",
        );

        expect(out.code).toBe(1);
        expect(out.stderr).toMatch("Invalid composes reference");
    });

    it("should support disabling url() rewriting (--no-rewrite)", async () => {
        const out = await tester(
            cli,
            "--no-rewrite",
            `--out=${temp("no-rewrite.css")}`,
            "fixtures/no-rewrite.css",
        );

        expect(out.code).toBe(0);
        expect(temp("no-rewrite.css")).toMatchFileSnapshot();
    });
});
