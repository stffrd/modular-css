"use strict";

const regex = /\bcss\.\w+?\b/gim;

module.exports = ({ dependencies, extensions = [ "html" ] }) => {
    if(typeof dependencies === "string") {
        dependencies = require(dependencies);
    }

    return {
        extensions,
        extractor : {
            extract(content) {
                const matches = content.match(regex);
                const keys = matches.map((match) => match.replace("css.", ""));

                // TODO: how to convert key into the dependencies w/o knowing the file?
                const classes = keys.reduce((arr, key) => {

                }, []);

                return classes;
            },
        },
    };
};
