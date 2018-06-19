/* eslint-disable-rule no-restricted-syntax */
const { Asset } = require("parcel-bundler");

const Processor = require("modular-css-core");
const output    = require("modular-css-core/lib/output.js");


class CSSAsset extends Asset {
    constructor(name, pkg, options) {
        super(name, pkg, options);

        this.type = "js";

        this.processor = new Processor();
    }

    async collectDependencies() {
        const result = await this.processor.string(this.name, this.contents);

        this.processor.dependencies(this.name).map((file) =>
            this.addDependency(file)
        );

        this.result = result;
    }

    async generate() {
        // let config = await this.getConfig([ ".mcssrc", "modular-css.config.js", "package.json" ]);

        // if(!config) {
        //     config = {};
        // }
        const exported = output.join(this.result.exports);

        const out = [
            `export default ${JSON.stringify(exported, null, 4)};`
        ];

        const { css } = await this.processor.output(this.name);

        return [
            {
                type  : "js",
                value : out.join("\n")
            },
            {
                type  : "css",
                value : css
            }
        ];
    }
}

module.exports = CSSAsset;
