/* eslint consistent-return: off */
"use strict";

const { temp, write } = require("test-utils/fixtures.js");

const watching = require("test-utils/rollup-watching.js");

require("test-utils/expect-file-snapshot.js");
require("test-utils/expect-dir-snapshot.js");
require("test-utils/expect-file-exists.js");

const plugin = require("../rollup.js");

const assetFileNames = "assets/[name][extname]";
const format = "es";
const map = false;

describe("/rollup.js", () => {
    describe("watch mode", () => {
        const { watch } = require("rollup");
        let watcher;
        
        afterEach(() => watcher.close());
        
        it("should generate updated output", (done) => {
            // Create v1 of the files
            write("watched.css", `
                .one {
                    color: red;
                }
            `);

            write("watched.js", `
                import css from "./watched.css";
                console.log(css);
            `);

            // Start watching
            watcher = watch({
                input  : temp("watched.js"),
                output : {
                    file : temp("output.js"),
                    format,
                    assetFileNames,
                },
                plugins : [
                    plugin({
                        map,
                        cwd : temp(),
                    }),
                ],
            });

            watcher.on("event", watching((builds) => {
                if(builds === 1) {
                    expect(temp("assets/output.css")).toMatchFileSnapshot();

                    setTimeout(() => write("watched.css", `
                        .two {
                            color: blue;
                        }
                    `), 100);

                    // continue watching
                    return;
                }

                expect(temp("assets/output.css")).toMatchFileSnapshot();

                return done();
            }));
        });

        it("should generate updated output for composes changes", (done) => {
            // Create v1 of the files
            write("watched.css", `
                .one {
                    color: red;
                }

                .two {
                    composes: one;
                    background: blue;
                }

                .three {
                    color: teal;
                }
            `);

            write("watched.js", `
                import css from "./watched.css";
                console.log(css);
            `);

            // Start watching
            watcher = watch({
                input  : temp("watched.js"),
                output : {
                    file : temp("output.js"),
                    format,
                    assetFileNames,
                },
                plugins : [
                    plugin({
                        map,
                        cwd : temp(),
                    }),
                ],
            });

            watcher.on("event", watching((builds) => {
                if(builds === 1) {
                    expect(temp()).toMatchDirSnapshot();

                    setTimeout(() => write("watched.css", `
                        .one {
                            color: green;
                        }

                        .two {
                            composes: one;
                            background: blue;
                        }

                        .three {
                            composes: one;
                            color: teal;
                        }
                    `), 100);

                    // continue watching
                    return;
                }

                expect(temp()).toMatchDirSnapshot();

                return done();
            }));
        });

        it("should update when a dependency changes", (done) => {
            // Create v1 of the files
            write("one.css", `
                .one {
                    composes: two from "./two.css";
                    composes: three from "./three.css";
                    color: red;
                }
            `);

            write("two.css", `
                .two {
                    color: blue;
                }
            `);
            
            write("three.css", `
                .three {
                    color: green;
                }
            `);
            
            write("watch.js", `
                import css from "./one.css";
                console.log(css);
            `);

            // Start watching
            watcher = watch({
                input  : temp("watch.js"),
                output : {
                    file : temp("output.js"),
                    format,
                    assetFileNames,
                },
                plugins : [
                    plugin({
                        map,
                        cwd : temp(),
                    }),
                ],
            });

            watcher.on("event", watching((builds) => {
                if(builds === 1) {
                    expect(temp("assets/output.css")).toMatchFileSnapshot();

                    setTimeout(() => write("two.css", `
                        .two {
                            color: green;
                        }
                    `), 100);

                    // continue watching
                    return;
                }

                expect(temp("assets/output.css")).toMatchFileSnapshot();

                return done();
            }));
        });

        it("should update when adding new css files", (done) => {
            // Create v1 of the files
            write("one.css", `
                .one {
                    color: red;
                }
            `);

            write("watch.js", `
                console.log("hello");
            `);

            // Start watching
            watcher = watch({
                input  : temp("watch.js"),
                output : {
                    file : temp("output.js"),
                    format,
                    assetFileNames,
                },
                plugins : [
                    plugin({
                        map,
                        cwd : temp(),
                    }),
                ],
            });

            watcher.on("event", watching((builds) => {
                if(builds === 1) {
                    expect(temp("assets/output.css")).not.fileExists();

                    setTimeout(() => write("watch.js", `
                        import css from "./one.css";

                        console.log(css);
                    `), 100);

                    // continue watching
                    return;
                }

                expect(temp("assets/output.css")).toMatchFileSnapshot();

                return done();
            }));
        });

        it("should update when a shared dependency changes", (done) => {
            // Create v1 of the files
            write("one.css", `
                .one {
                    composes: two from "./two.css";
                    color: red;
                }
            `);

            write("two.css", `
                .two {
                    color: green;
                }
            `);
            
            write("three.css", `
                .three {
                    composes: two from "./two.css";
                    color: teal;
                }
            `);

            write("watch.js", `
                import css from "./one.css";
                import css3 from "./three.css";

                console.log(css, css3);
            `);

            // Start watching
            watcher = watch({
                input  : temp("watch.js"),
                output : {
                    file : temp("output.js"),
                    format,
                    assetFileNames,
                },
                plugins : [
                    plugin({
                        map,
                        cwd : temp(),
                    }),
                ],
            });

            watcher.on("event", watching((builds) => {
                if(builds === 1) {
                    expect(temp("assets/output.css")).toMatchFileSnapshot();
                    
                    setTimeout(() => write("two.css", `
                    .two {
                        color: yellow;
                    }
                    `), 100);
                    
                    // continue watching
                    return;
                }
                
                expect(temp("assets/output.css")).toMatchFileSnapshot();

                return done();
            }));
        });
        
        // TODO: causing jest to hang but say the test has completed weirdly
        it("should watch when using code splitting", (done) => {
            // Create v1 of the files
            write("one.css", `
                .one {
                    composes: shared from "./shared.css";
                    color: red;
                }
            `);

            write("two.css", `
                .two {
                    color: green;
                }
            `);
            
            write("shared.css", `
                @value baloo from "./values.css";

                .shared {
                    color: baloo;
                }
            `);
            
            write("values.css", `
                @value baloo: blue;
            `);
            
            write("one.js", `
                import css from "./one.css";

                console.log(css);
            `);
            
            write("two.js", `
                import two from "./two.css";
                import "./shared.css";

                console.log(css);
            `);

            // Start watching
            watcher = watch({
                experimentalCodeSplitting : true,

                input : [
                    temp("one.js"),
                    temp("two.js"),
                ],

                output : {
                    dir : temp(),
                    format,
                    assetFileNames,
                },
                
                plugins : [
                    plugin({
                        map,
                        cwd : temp(),
                    }),
                ],
            });

            watcher.on("event", watching((builds) => {
                if(builds === 1) {
                    expect(temp("assets")).toMatchDirSnapshot();
                    
                    // Create v2 of the file we want to change
                    setTimeout(() => write("values.css", `
                        @value baloo: aqua;
                    `), 100);
                    
                    // continue watching
                    return;
                }
                
                expect(temp("assets")).toMatchDirSnapshot();

                return done();
            }));
        });
    });
});
