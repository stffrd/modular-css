"use strict";

const browserify = require("browserify");
const from = require("from2-string");
const dedent = require("dedent");
    
const { root, find, short, temp } = require("test-utils/fixtures.js");

require("test-utils/expect-file-snapshot.js");

const bundle = require("./lib/bundle.js");
    
const plugin = require("../browserify.js");

describe("/browserify.js", () => {
    // Because these tests keep failing CI...
    jest.setTimeout(20000);
        
    describe("basic functionality", () => {
        it("should not error if no options are supplied", () => {
            const build = browserify();
            const error = jest.fn();
            
            build.on("error", error);

            build.plugin(plugin);

            expect(error).not.toHaveBeenCalled();
        });
        
        it("should error if an invalid extension is applied", (done) => {
            const build = browserify();
            
            build.on("error", (err) => {
                expect(err).toMatchSnapshot();

                done();
            });

            build.plugin(plugin, { ext : false });
        });

        it("should error on invalid CSS", (done) => {
            const build = browserify({
                entries : from(dedent(`
                    require("${find("invalid.css")}");
                `)),
            });
            
            let errors = 0;
            
            build.plugin(plugin);
            
            build.bundle((err) => {
                expect(err).toBeTruthy();
                
                if(++errors === 1) {
                    expect(err.name).toMatch(/SyntaxError|CssSyntaxError/);
                    
                    return false;
                }
                
                return done();
            });
        });

        it("should replace require() calls with the exported identifiers", async () => {
            const build = browserify({
                basedir : root,
                entries : from(dedent(`
                    require("./${short("simple.css")}");
                `)),
            });
        
            build.plugin(plugin);
            
            const out = await bundle(build);
            
            expect(out.toString()).toMatchSnapshot();
        });

        it("should correctly rewrite urls based on the destination file", async () => {
            const build = browserify({
                basedir : root,
                entries : from(dedent(`
                    require(./"${short("relative.css")}");
                `)),
            });
        
            build.plugin(plugin, {
                css : temp("relative.css"),
            });
            
            await bundle(build);
            
            expect(temp("relative.css")).toMatchFileSnapshot();
        });

        it("should use the specified namer function", async () => {
            const build = browserify({
                basedir : root,
                entries : from(dedent(`
                    require("${find("keyframes.css")}");
                `)),
            });
            
            build.plugin(plugin, {
                cwd   : temp(),
                css   : temp("namer-fn.css"),
                namer : () => "a",
            });
            
            await bundle(build);
            
            expect(temp("namer-fn.css")).toMatchFileSnapshot();
        });

        it("should include all CSS dependencies in output css", async () => {
            const build = browserify({
                basedir : root,
                entries : from(dedent(`
                    require("./${short("start.css")}");
                `)),
            });
            
            build.plugin(plugin, {
                css : temp("include-css-deps.css"),
            });
            
            const out = await bundle(build);
            
            expect(out).toMatchSnapshot();
            expect(temp("include-css-deps.css")).toMatchFileSnapshot();
        });

        it("should write out the complete exported identifiers when `json` is specified", async () => {
            const build = browserify({
                entries : from(dedent(`
                    require("${find("multiple.css")}");
                `)),
            });
            
            build.plugin(plugin, {
                json : temp("export-all-identifiers.json"),
            });
            
            await bundle(build);
            
            expect(temp("export-all-identifiers.json")).toMatchFileSnapshot();
        });

        it("should not include duplicate files in the output multiple times", async () => {
            const build = browserify({
                basedir : root,
                entries : from(dedent(`
                    require("./${short("start.css")}");
                    require("./${short("local.css")}");
                `)),
            });
        
            build.plugin(plugin, {
                css : temp("avoid-duplicates.css"),
            });
            
            const out = await bundle(build);
            
            expect(out).toMatchSnapshot();
            expect(temp("avoid-duplicates.css")).toMatchFileSnapshot();
        });
        
        it("should output an inline source map when the debug option is specified", async () => {
            const build = browserify({
                debug   : true,
                basedir : root,
                entries : from(dedent(`
                    require("${find("start.css")}");
                `)),
            });
            
            build.plugin(plugin, {
                css : temp("source-maps.css"),
            });
            
            await bundle(build);
            
            expect(temp("source-maps.css")).toMatchFileSnapshot();
        });

        it("should output an external source map when the debug option is specified", async () => {
            const build = browserify({
                debug   : true,
                basedir : root,
                entries : from(dedent(`
                    require("${find("start.css")}");
                `)),
            });

            build.plugin(plugin, {
                css : temp("source-maps.css"),
                map : {
                    inline : false,
                },
            });

            await bundle(build);
            
            expect(temp("source-maps.css")).toMatchFileSnapshot();
            expect(temp("source-maps.css.map")).toMatchFileSnapshot();
        });
    });
});
