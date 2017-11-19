# Pug Asset Loader

### Author: https://github.com/steelstring94

## Description

Pug Asset Loader (pug-asset-loader) is a Webpack loader designed to process Pug templates and output Pug files where assets, such as images, have been automatically processed by Webpack.  It makes available a `pal()` pseudo-function in your Pug templates to which you pass a file path.

An example use case is to automatically load only the images your template actually uses, and automatically copy them to your dist folder in the appropriate location as defined by file-loader. pug-asset-loader also supports integration with url-loader and will automatically replace `pal()` calls with data URLs if url-loader is in use and returns a data URL.

Versions follow the SemVer pattern.

## Usage:

In your Pug templates, wherever you would normally put a file URL, simply use `pal(<PATH_TO_FILE>)`

For example:  `img(src="pal(images/image.jpg)")`

You need not surround the file path argument with quotes, although the loader will still function as expected if you do.

pug-asset-loader will have that file copied as you specify with file-loader, or replace the `pal()` call with a data URL returned by url-loader. It is up to you to make sure you have whichever of these installed that you require.

If for some reason you don't want to actually process a pal() call, just add a backslash before it, like `\pal(...)`.  The backslash will be automatically removed in the output.

## Options:

You may pass pug-asset-loader an options object with the following properties:

- `root: String`:  Resource root of your dependent files.  For example, if in your Pug you have `img(src="pal(images/image.jpg)")` and that path is `/src/images/image.jpg` relative to the root of your project, then you should set this option to `./src` (so relative to the location of `webpack.config.js`).  Trailing slash will be added automatically if not present.

If you do not set this option, the resource root will be assumed to be a sub-directory of the location of whatever Pug file is presently being processed.  Unless you have a very peculiar (and probably inefficient) organization of your project, this is virtually guaranteed to cause you problems, so it's advised you ensure to explicitly set a resource root.

- `outputPath: String`:  Custom path with which to replace the `pal()` calls. Does not affect where the loaded files are output.  Trailing slash will be added automatically if not present.  If unspecified, path will not be changed.

## License:

MIT License

Copyright (c) 2017 https://github.com/steelstring94

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

# pug-asset-loader
