import fs from "fs";

import m from "mithril";
import throttle from "throttleit";

import state from "./state.js";

export default async () => {
    var hash = btoa(
            JSON.stringify(
                state.files.map((name) => ({
                    name,
                    css : fs.readFileSync(name, "utf8"),
                }))
            )
        );
    
    location.hash = `#${hash}`;
        
    try {
        await Promise.all(
            [ ...state.files].map((file) =>
                state.processor.file(file)
            )
        );

        const result = await state.processor.output();
        
        state.output.css  = result.css;
        state.output.json = JSON.stringify(result.compositions, null, 4);

        state.error = false;
        
        if(state.tab === "Errors") {
            state.tab = "CSS";
        }
    } catch(e) {
        state.error = `${e.toString()}\n\n${e.stack}`;
    }
}

export const throttled = throttle(process, 200);
