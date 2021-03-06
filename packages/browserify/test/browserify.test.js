"use strict";

var browserify = require("browserify"),
    from       = require("from2-string"),
    shell      = require("shelljs"),
    
    read = require("@modular-css/test-utils/read.js")(__dirname),

    bundle = require("./lib/bundle.js"),
    
    plugin = require("../browserify.js");

describe("/browserify.js", () => {
    // Because these tests keep failing CI...
    jest.setTimeout(20000);
        
    afterAll(() => shell.rm("-rf", "./packages/browserify/test/output/browserify"));

    describe("basic functionality", () => {
        it("should not error if no options are supplied", () => {
            var build = browserify(),
                error = jest.fn();
            
            build.on("error", error);

            build.plugin(plugin);

            expect(error).not.toHaveBeenCalled();
        });
        
        it("should error if an invalid extension is applied", (done) => {
            var build = browserify();
            
            build.on("error", (err) => {
                expect(err).toMatchSnapshot();

                done();
            });

            build.plugin(plugin, { ext : false });
        });

        it("should error on invalid CSS", (done) => {
            var build = browserify({
                    entries : from("require('./packages/browserify/test/specimens/invalid.css');"),
                }),
                errors = 0;
            
            build.plugin(plugin);
            
            build.bundle((err) => {
                ++errors;
                
                expect(err).toBeTruthy();
                
                if(errors === 1) {
                    expect(err.name).toMatch(/SyntaxError|CssSyntaxError/);
                    
                    return false;
                }
                
                return done();
            });
        });

        it("should replace require() calls with the exported identifiers", () => {
            var build = browserify({
                    entries : from("require('./packages/browserify/test/specimens/simple.css');"),
                });
            
            build.plugin(plugin);
            
            return bundle(build)
                .then((out) => expect(out.toString()).toMatchSnapshot());
        });

        it("should correctly rewrite urls based on the destination file", () => {
            var build = browserify({
                    entries : from("require('./packages/browserify/test/specimens/relative.css');"),
                });
            
            build.plugin(plugin, {
                css : "./packages/browserify/test/output/browserify/relative.css",
            });
            
            return bundle(build)
                .then(() => expect(read("./browserify/relative.css")).toMatchSnapshot());
        });

        it("should use the specified namer function", () => {
            var build = browserify({
                    entries : from("require('./packages/browserify/test/specimens/keyframes.css');"),
                });
            
            build.plugin(plugin, {
                css   : "./packages/browserify/test/output/browserify/namer-fn.css",
                namer : () => "a",
            });
            
            return bundle(build)
                .then(() => expect(read("./browserify/namer-fn.css")).toMatchSnapshot());
        });

        it("should include all CSS dependencies in output css", () => {
            var build = browserify({
                    entries : from("require('./packages/browserify/test/specimens/start.css');"),
                });
            
            build.plugin(plugin, { css : "./packages/browserify/test/output/browserify/include-css-deps.css" });
            
            return bundle(build)
                .then((out) => {
                    expect(out).toMatchSnapshot();
                    expect(read("./browserify/include-css-deps.css")).toMatchSnapshot();
                });
        });

        it("should write out the complete exported identifiers when `json` is specified", () => {
            var build = browserify(from("require('./packages/browserify/test/specimens/multiple.css');"));
            
            build.plugin(plugin, {
                json : "./packages/browserify/test/output/browserify/export-all-identifiers.json",
            });
            
            return bundle(build)
                .then(() => expect(read("./browserify/export-all-identifiers.json")).toMatchSnapshot());
        });

        it("should not include duplicate files in the output multiple times", () => {
            var build = browserify(
                    from("require('./packages/browserify/test/specimens/start.css'); require('./packages/browserify/test/specimens/local.css');")
                );
            
            build.plugin(plugin, { css : "./packages/browserify/test/output/browserify/avoid-duplicates.css" });
            
            return bundle(build)
                .then((out) => {
                    expect(out).toMatchSnapshot();
                    expect(read("./browserify/avoid-duplicates.css")).toMatchSnapshot();
                });
        });
        
        it("should output an inline source map when the debug option is specified", () => {
            var build = browserify({
                    debug   : true,
                    entries : from("require('./packages/browserify/test/specimens/start.css');"),
                });
            
            build.plugin(plugin, { css : "./packages/browserify/test/output/browserify/source-maps.css" });
            
            return bundle(build)
                .then(() => expect(read("./browserify/source-maps.css")).toMatchSnapshot());
        });

        it("should output an external source map when the debug option is specified", () => {
            var build = browserify({
                    debug   : true,
                    entries : from("require('./packages/browserify/test/specimens/start.css');"),
                });

            build.plugin(plugin, {
                css : "./packages/browserify/test/output/browserify/source-maps.css",
                map : {
                    inline : false,
                },
            });

            return bundle(build)
                .then(() => {
                    expect(read("./browserify/source-maps.css")).toMatchSnapshot();
                    expect(read("./browserify/source-maps.css.map")).toMatchSnapshot();
                });
        });
    });
});
