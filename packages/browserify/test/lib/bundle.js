"use strict";

module.exports = (build) =>
    new Promise((resolve) => {
        build.bundle((err, out) => {
            if(err) {
                console.error(err);
            }
            
            expect(err).toBeFalsy();

            // CSS processing in the plugin takes non-zero amount of time,
            // this is ridiculous but seemingly unavoidable
            setTimeout(
                () => resolve(out.toString()),
                25
            );
        });
    });
