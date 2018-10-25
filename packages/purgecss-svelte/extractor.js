"use strict";

"use strict";

const regex = /\bcss\.\w+?\b/gim;

module.exports = ({ dependencies, extensions = [ "html" ] }) => {
    if(typeof dependencies === "string") {
        dependencies = require(dependencies);
    }

    return {
        extract(content) {
            const matches = content.match(regex);
            const keys = matches.map((match) => match.replace("css.", ""));

            const classes = keys.reduce((arr, key) => {

            }, []);
        },
    };
};
