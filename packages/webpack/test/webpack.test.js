/* eslint-disable max-statements */
"use strict";

const fs   = require("fs");
const path = require("path");

const webpack = require("webpack");
const dedent = require("dedent");

const namer = require("test-utils/namer.js");
const { cwd, find, temp, read, write } = require("test-utils/fixtures.js");

require("test-utils/expect-dir-snapshot.js");
require("test-utils/expect-file-snapshot.js");
require("test-utils/expect-map-snapshot.js");

const Plugin = require("../plugin.js");

const loader = require.resolve("../loader.js");
const test   = /\.css$/;

const success = (err, stats) => {
    expect(err).toBeFalsy();
    
    if(stats.hasErrors()) {
        throw stats.toJson().errors[0];
    }
};

function config({ entry, use, plugin, watch = false }) {
    return {
        entry,
        watch,
        context : cwd,

        mode        : "development",
        recordsPath : path.join(__dirname, "./records", `${path.basename(entry)}.json`),
        output      : {
            path     : temp(),
            filename : "./output.js",
        },
        module : {
            rules : [
                {
                    test,
                    use : use ? use : loader,
                },
            ],
        },
        plugins : [
            new Plugin(Object.assign({
                cwd,
                namer,
                css : "./output.css",
            }, plugin)),
        ],
    };
}

describe("/webpack.js", () => {
    it("should be a function", () => {
        expect(typeof Plugin).toBe("function");
    });

    it("should output css to disk", (done) => {
        webpack(config({
            entry : find("simple.js"),
        }), (err, stats) => {
            success(err, stats);

            expect(temp()).toMatchDirSnapshot();

            done();
        });
    });

    it("should output json to disk", (done) => {
        webpack(config({
            entry  : find("simple.js"),
            plugin : {
                json : "./output.json",
            },
        }), (err, stats) => {
            success(err, stats);

            expect(temp()).toMatchDirSnapshot();

            done();
        });
    });

    it("should output inline source maps", (done) => {
        webpack(config({
            entry  : find("simple.js"),
            plugin : {
                map : true,
            },
        }), (err, stats) => {
            success(err, stats);

            expect(temp("output.css")).toMatchFileSnapshot();

            done();
        });
    });

    it("should output external source maps to disk", (done) => {
        webpack(config({
            entry  : find("simple.js"),
            plugin : {
                map : {
                    inline : false,
                },
            },
        }), (err, stats) => {
            success(err, stats);

            expect(temp("output.css.map")).toMatchMapSnapshot();

            done();
        });
    });

    it("should report errors", (done) => {
        webpack(config({
            entry : find("invalid.js"),
        }), (err, stats) => {
            expect(stats.hasErrors()).toBeTruthy();

            // TODO: use .toMatchObject
            expect(stats.toJson().errors[0]).toMatch("Invalid composes reference");

            done();
        });
    });

    it("should report warnings on invalid property names", (done) => {
        webpack(config({
            entry : find("invalid-name.js"),
        }), (err, stats) => {
            expect(stats.hasWarnings()).toBeTruthy();

            expect(stats.toJson().warnings[0]).toMatch("Invalid JS identifier");

            done();
        });
    });

    it("should handle dependencies", (done) => {
        webpack(config({
            entry  : find("start.js"),
            plugin : {
                json : "./output.json",
            },
        }), (err, stats) => {
            success(err, stats);

            expect(temp()).toMatchDirSnapshot();

            done();
        });
    });

    it("should support ES2015 default exports", (done) => {
        webpack(config({
            entry : find("es2015-default.js"),
        }), (err, stats) => {
            success(err, stats);

            expect(temp()).toMatchDirSnapshot();

            done();
        });
    });

    it("should support ES2015 named exports", (done) => {
        webpack(config({
            entry : find("es2015-named.js"),
        }), (err, stats) => {
            success(err, stats);

            expect(temp()).toMatchDirSnapshot();

            done();
        });
    });

    it("should support disabling namedExports when the option is set", (done) => {
        webpack(config({
            entry : find("simple.js"),
            use   : {
                loader,
                options : {
                    namedExports : false,
                },
            },
        }), (err, stats) => {
            success(err, stats);

            expect(temp("output.js")).toMatchFileSnapshot();

            done();
        });
    });

    it.skip("should generate correct builds in watch mode when files change", (done) => {
        var changed = 0,
            compiler, watcher;
        
        // Create v1 of the files
        write("watched.css", dedent(`
            .one {
                color: red;
            }
        `));

        write("watched.js", dedent(`
            import css from "./watched.css";

            console.log(css);
        `));
        
        // TODO: Figure out how to pass temp() as the CWD to webpack
        compiler = webpack(config({
            entry : temp("watched.js"),
            watch : true,

            plugin : {
                cwd : temp(),
            },
        }));

        compiler.plugin("watch-close", () => {
            // setTimeout is to give webpack time to shut down correctly
            // w/o it the build freezes forever!
            setTimeout(done, 50);
        });
        
        watcher = compiler.watch(null, (err, stats) => {
            changed++;
            
            success(err, stats);

            expect(temp()).toMatchDirSnapshot();

            if(changed < 2) {
                return write("watched.css", dedent(`
                    .two {
                        color: blue;
                    }
                `));
            }

            return watcher.close();
        });
    });

    it.skip("should generate correct builds when files change", () => {
        var changed = "./packages/webpack/test/output/changed.css",
            compiler;
        
        // wrap compiler.run in a promise for easier chaining
        function run() {
            return new Promise((resolve, reject) =>
                compiler.run((err, stats) => {
                    if(stats.hasErrors()) {
                        return reject(stats);
                    }
                    
                    expect(read("output.js")).toMatchSnapshot();
                    expect(read("output.css")).toMatchSnapshot();
                    
                    return resolve(stats);
                })
            );
        }

        compiler = webpack(config({
            entry : find("change.js"),
        }));
        
        // Create v1 of the file
        fs.writeFileSync(changed, ".one { color: red; }");

        // Run webpack the first time
        return run()
            .then(() => {
                // v2 of the file
                fs.writeFileSync(changed, ".two { color: blue; }");

                return run();
            })
            .then(() => {
                fs.unlinkSync(changed);

                return run();
            })
            // This build fails because the file is missing
            .catch((stats) => {
                expect(stats.toJson().errors[0]).toMatch("no such file or directory");
                
                fs.writeFileSync(changed, ".three { color: green; }");

                return run();
            });
    });
});
