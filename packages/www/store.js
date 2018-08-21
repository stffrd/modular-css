import fs from "fs";

import Processor from "modular-css-core";
import { Store } from "svelte/store.js";

class CssStore extends Store {
    constructor() {
        super();

        this._processor = new Processor({
            resolvers : [
                (src, file) => {
                    file = file.replace(/^\.\.\/|\.\//, "");

                    return `/${file}`;
                },
            ],
        });
    }

    read(file) {
        return fs.readFileSync(file);
    }

    write(file, css) {
        fs.writeFileSync(file, css);

        const { files } = this.get();

        files[file] = css;

        this.set({ files });
    }

    delete(file) {
        fs.unlinkSync(file);

        const { files } = this.get();

        delete files[file];

        this.set({ files });
    }

    async process() {
        const { files } = this.get;
        const processor = this._processor;

        var hash = btoa(
                JSON.stringify(
                    Object.entries(files).map(([ name, css ]) => ({
                        name,
                        css,
                    }))
                )
            );

        location.hash = `#${hash}`;

        try {
            await Promise.all(
                Object.entries(files).map(([ file, css ]) => processor.string(file, css))
            );

            const result = await processor.output();

            this.set({
                css : result.css,
                json : JSON.stringify(result.compositions, null, 4),
                error : false,
                tab : "CSS"
            });
        } catch(e) {
            this.set({
                error : `${e.toString()}\n\n${e.stack}`,
                tab : "Error"
            });
        }
    }
};

const store = new CssStore({
    files : {},

    css   : "",
    json  : "",
    tab   : "CSS",
    error : false,
});

debugger;

// Computed properties
store.compute("count", [ "files" ], (files) => files ? Object.keys(files).length - 1: 0);

store.compute(
    "report",
    [ "files", "css", "json", "error" ],
    (files, css, json, error) => {
        if(!files) {
            return;
        }

        return `## Files\n\n${
            Object.entries(files)
                .map(([ file, css ]) => `/* ${file} */\n${css}`)
                .concat(
                    css && `## CSS Output\n\n${css}`,
                    json && `## JSON Output\n\n${json}`,
                    error && `## Error\n\n${error}`
                )
                .filter(Boolean)
                .join("\n\n")
            }
        `;
    }
);

store.on("state", ({ changed, current }) => {
    console.log({ changed, current });

    if(changed.files) {
        return store.process();
    }
});

// Debugging
(global || window).store = store;

export default store;
