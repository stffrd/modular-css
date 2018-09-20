"use strict";

const regex = /\bcss\.\w+?\b/gim;

module.exports = class PurgeFromSvelte {
    static extract(content) {
        const matches = content.match(regex);

        return matches.map((match) => match.replace("css.", ""));
    }
};
