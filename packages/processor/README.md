@modular-css/processor  [![NPM Version](https://img.shields.io/npm/v/@modular-css/processor.svg)](https://www.npmjs.com/package/@modular-css/processor) [![NPM License](https://img.shields.io/npm/l/@modular-css/processor.svg)](https://www.npmjs.com/package/@modular-css/processor) [![NPM Downloads](https://img.shields.io/npm/dm/@modular-css/processor.svg)](https://www.npmjs.com/package/@modular-css/processor)
===========

<p align="center">
    <a href="https://gitter.im/modular-css/modular-css"><img src="https://img.shields.io/gitter/room/modular-css/modular-css.svg" alt="Gitter" /></a>
</p>

The core functionality of [`modular-css`](https://npmjs.com/modular-css) exposed as a JS API.

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Options](#options)
- [Properties](#properties)

## Install

`$ npm i @modular-css/processor`

## Usage

Instantiate a new `Processor` instance, call it's `.file(<path>)` or `.string(<name>, <contents>)` methods, and then use the returned Promise to get access to the results/output.

```js
const Processor = require("@modular-css/processor");
const processor = new Processor({
    // See "API Options" for valid options to pass to the Processor constructor
});

// Add entries, either from disk using .file() or as strings with .string()
const result = await processor.file("./entry.css");

// result contains
//  .exports - Scoped selector mappings
//  .files - metadata about the file hierarchy

await processor.string("./fake-file.css", ".class { color: red; }");

// Once all files are added, use .output() to get at the rewritten CSS
const results = await processor.output();

// Output CSS lives on the .css property
results.css;

// Source map (if requested) lives on the .map property
results.map;
```

## API

### `.string(file, css)`

Returns a promise. Add `file` to the `Processor` instance with `css` contents.

### `.file(file)`

Returns a promise. Add `file` to the `Processor` instance, reads contents from disk using `fs`.

### `.output({ args })`

Returns a promise. Finalize processing of all added CSS and create combined CSS output file.

Passing `files` as part of `args` will result in getting back combined output CSS just for the listed files and their dependencies.

Passing `to` as part of `args` will be passed along to teh `after` and `done` hooks for proper path adjustment in maps & any plugins that use it.

**WARNING**: Calling `.output()` before any preceeding `.file(...)`/`.string(...)` calls have resolved their returned promises will return a rejected promise. See [usage](#usage) for an example of correct usage.

### `.remove([files])`

Remove files from the `Processor` instance. Accepts a single file or array of files.

### `.dependencies([file])`

Returns an array of file paths. Accepts a single file argument to get the dependencies for, will return entire dependency graph in order if argument is omitted.

## Options

### `before`

Specify an array of PostCSS plugins to be run against each file before it is processed.

```js
new Processor({
    before : [ require("postcss-import") ]
});
```

### `after`

Specify an array of PostCSS plugins to be run after files are processed, but before they are combined. Plugin will be passed a `to` and `from` option.

**By default** [`postcss-url`](https://www.npmjs.com/package/postcss-url) is used in `after` mode.

```js
new Processor({
    after : [ require("postcss-someplugin") ]
});
```

### `done`

Specify an array of PostCSS plugins to be run against the complete combined CSS.

```js
new Processor({
    done : [ require("cssnano")()]
});
```

### `map`

Enable source map generation. Can also be passed to `.output()`.

**Default**: `false`

```js
new Processor({
    map : true
});
```

### `cwd`

Specify the current working directory for this Processor instance, used when resolving `composes`/`@value` rules that reference other files.

**Default**: `process.cwd()`

```js
new Processor({
    cwd : path.join(process.cwd(), "/sub/dir")
})
```

### `namer`

Specify a function (that takes `filename` & `selector` as arguments to produce scoped selectors.

**Default**: Function that returns `"mc" + unique-slug(<file>) + "_" + selector`

```js
new Processor({
    namer : function(file, selector) {
        return file.replace(/[:\/\\ .]/g, "") + "_" + selector;
    }
});
```

### `resolvers`

If you want to provide your own file resolution logic you can pass an array of resolver functions. Each resolver function receives three arguments:

- `src`, the file that included `file`
- `file, the file path being included by `src`
- `resolve`, the default resolver function

Resolver functions should either return an absolute path or a falsey value. They must also be synchronous.

**Default**: See [/src/lib/resolve.js](/src/lib/resolve.js) for the default implementation.

```js
new Processor({
    resolvers : [
        (src, file, resolve) => ...,
        require("@modular-css/path-resolver")(
            "./some/other/path"
        )
    ]
})
```

### `exportGlobals`

Enable exporting `:global` identifiers.

**Default**: true

```js
new Processor({
    exportDefaults: false
})
```

```css
/* exportGlobals: true */
.a {}
:global(.b) {}

/* Outputs
{
    "a" : "mc12345_a",
    "b" : "b"
}
*/

/* exportGlobals: false */
.a {}
:global(.b) {}

/* Outputs
{
    "a" : "mc12345_a"
}
*/
```

## Properties

### `.files`

Returns an object keyed by absolute file paths of all known files in the `Processor` instance.

### `.options`

Returns the options object passed to the `Processor` augmented with the defaults.
