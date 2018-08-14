import fs from "fs";

import Processor from "modular-css-core";
import { Store } from "svelte/store.js";

class McssStore extends Store {
    createFile() {
        const { files } = this.get();
        
        var file = `/${files.size + 1}.css`;

        fs.writeFileSync(file, `\n`);

        files.add(file);

        this.set({
            files,
        });
    }

    removeFile(name) {
        const { files } = this.get();

        files.delete(name);

        this.set({
            files,
        });
    }

    report() {
        const { files, output, error } = this.get();

        return `## Files\n\n${
            [...files]
                .map((file) => `/* ${file} */\n${fs.readFileSync(file, "utf8")}`)
                .concat(
                    output.css && `## CSS Output\n\n${output.css}`,
                    output.json && `## JSON Output\n\n${output.json}`,
                    error && `## Error\n\n${error}`
                )
                .filter(Boolean)
                .join("\n\n")
        }`;
    }
};

const store = new McssStore({
    files : new Set(),

    output : {
        css : "",
        js  : false,
    },

    processor : new Processor({
        resolvers : [
            (src, file) => {
                file = file.replace(/^\.\.\/|\.\//, "");

                return `/${file}`;
            },
        ],
    }),
    
    tab : "CSS",
    
    error : false,
});

// Computed properties
store.compute("count", [ "files" ], (files) => files.size);
store.compute(
    "report",
    [ "files", "output", "error" ],
    (files, output, error) => `## Files\n\n${
        [...files]
            .map((file) => `/* ${file} */\n${fs.readFileSync(file, "utf8")}`)
            .concat(
                output.css && `## CSS Output\n\n${output.css}`,
                output.json && `## JSON Output\n\n${output.json}`,
                error && `## Error\n\n${error}`
            )
            .filter(Boolean)
            .join("\n\n")
    }`
);

// Debugging
(global || window).store = store;

export default store;
