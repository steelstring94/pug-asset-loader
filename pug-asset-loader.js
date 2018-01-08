/* Webpack loader for Pug files.  Exposes
 * pal() function in Pug files, which
 * takes a file path argument and passes
 * the file to Webpack's module system
 * for appropriate loading.
 *
 * Author: https://github.com/steelstring94
 *
 * This software is copyright 2017 steelstring94 on Github.
 * This software is released under the MIT license.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

module.exports = function pugAssetLoader(content) {

  const fs = require('fs');
  const path = require('path');
  const loaderUtils = require('loader-utils');
  const callback = this.async();

  //reqs will hold several objects
  //that contain paths to required
  //files and pal() calls to be
  //replaced in the output Pug file.
  let reqs = [];
  let options = loaderUtils.getOptions(this);

  //This option is required. It specifies
  //the path to the root of the Pug file's
  //assets relative to the location
  //of the Pug files.
  let contextualRoot;

  if(options && options.hasOwnProperty('root')) {
    contextualRoot = path.relative(this.context, options.root);

    //Ensure there is a trailing slash.
    if(contextualRoot[contextualRoot.length-1] !== path.sep) {
      contextualRoot = contextualRoot + path.sep;
    }
  }

  //If a resource root is not explicitly
  //set, it defaults to the directory
  //of the Pug file currently being
  //processed.  This is likely to
  //result in unwanted behavior,
  //so it is strongly recommended
  //to always explicitly set the root.
  else {
    contextualRoot = this.context;
  }

  //Ensure trailing slash for custom
  //outputPath, if one was provided.
  if(options && options.hasOwnProperty('outputPath')) {
    if(options.outputPath[options.outputPath.length-1] !== path.sep) {
      options.outputPath = options.outputPath + path.sep;
    }
  }

  let funcName = 'pal';

  if(options && options.hasOwnProperty('funcName')) {
    funcName = options.funcName;
  }

  //Set up regex to search for pal() calls
  const palRE = new RegExp(funcName + '\\(', 'gi');

  //verifyRE will be used to ensure the
  //rest of the pal() statement follows
  //the required patterns.  We need this
  //separate RegExp because we need to
  //make use of the lastIndex property
  //of the first one as a pointer to the
  //beginning of the file path.
  const verifyRE = new RegExp(/'?[^)]+'?\)/, 'y');

  //We need to execute palRE once to kick things
  //off, and we need to save it to a variable
  //because we need information from it.
  let regexResult = palRE.exec(content);

  //regexResult will be null when there
  //are no more matches to be found in
  //the file.
  while(regexResult != null) {

    //Verification takes place from
    //the beginning of what should
    //be the file path.
    verifyRE.lastIndex = palRE.lastIndex;

    if(!verifyRE.test(content)) {

      //Run the next iteration of the regex search
      //and continue to the next iteration of
      //the while() loop.
      regexResult = palRE.exec(content);

      continue;
    }

    //If pal() (or other custom function name)
    //call is escaped, remove the
    //backslash, then continue.
    if(content[regexResult.index-1] === '\\') {
      content = content.slice(0, regexResult.index-1) + content.slice(regexResult.index, content.length);

      regexResult = palRE.exec(content);

      continue;
    }

    //pathStartIndex is the beginning of
    //the path to the required file.
    let pathStartIndex = palRE.lastIndex;

    //inputPath will hold the actual file path itself.
    let inputPath = content.slice(pathStartIndex, content.indexOf(')', pathStartIndex));

    //Remove any quotes around the file path.
    if(/^['"]/.test(inputPath)) {
      inputPath = inputPath.slice(1);
    }

    if(/['"]$/.test(inputPath)) {
      inputPath = inputPath.slice(0, inputPath.search(/['"]/));
    }

    //Just the file name, with extension.
    let fileName = path.basename(inputPath);

    //Just path withotu file name.
    let inFilePath = path.dirname(inputPath) + path.sep;

    //palStart holds the index of the first
    //letter in funcName, so that we can remove
    //the function call and replace it
    //with the file path.
    let palStart = content.indexOf(funcName, regexResult.index);

    //palStmt is the pal()/funcName statement in
    //full. This will be used with replace()
    //to replace the pal() call with a
    //file path in the output file.

    //We add 1 to the second argument of
    //slice() in order to include the
    //closing parenthesis in what we replace.
    let palStmt = content.slice(palStart, content.indexOf(')', pathStartIndex) + 1);

    //Path with file name of the required
    //file. This will be used to find the
    //file referenced in pal().
    let filePath = inFilePath + fileName;

    //An object to hold the path to the
    //dependent file and the pal()
    //statement to be replaced in the Pug
    //file.  This will be used to generate an
    //array of Promises with the
    //relevant information about final
    //file paths or data URLs.
    let reqObj = {
      filePath: filePath,
      palStmt: palStmt
    }

    //reqs is an array over which the
    //loader will iterate to extract file
    //paths and the appropriate pal()
    //call to replace with the end result.
    reqs.push(reqObj);

    //Run the next iteration of the regex search.
    regexResult = palRE.exec(content);
  }

  //Takes a request object, as defined above,
  //and returns a Promise that resolves to
  //a string with either the file name
  //or the data URL.
  function load(reqObj) {
      return new Promise((resolve, reject) => {
        this.loadModule(reqObj.loadPath, (err, res) => {
            if(err) {
              return reject(err);
            }
            if(!res) {
              //Webpack seems to fill in its own error
              //here.  TODO?
              return reject();
            }
            //If it's a data URL, we slice out just
            //the URL, ignoring irrelevant bits.
            if(/data:image/.test(res)) {
              let dataURL = res.slice(res.indexOf('data:image'), res.lastIndexOf('"'));
              return resolve(dataURL);
            }
            else {
              //If it's an actual file name, we slice
              //from the last slash to the first double
              //quote after the last slash - this will
              //extract just the file name.
              let fileName = res.slice(res.lastIndexOf(path.sep)+1, res.indexOf('"', res.lastIndexOf(path.sep)));
              return resolve(fileName);
            }
        });
      });
    }

    //Gets all the promises from load() and
    //calls its callback with the final file
    //string that should be returned to
    //Webpack.  Self-invoked.
    (localCallback => {

      let promises = [];

      //For each request object, set a
      //loadPath property that is just
      //the file path plus contextual root.
      //Then add the promise returned by
      //load() to the promises array.
      reqs.forEach(reqObj => {
        reqObj.loadPath = contextualRoot + reqObj.filePath;

        //We must use call() to force load() to use
        //the current this, otherwise it will bind
        //a new one where this.loadModule() is not
        //available.
        promises.push(load.call(this, reqObj).catch(err => { /* TODO? */ }));
      });

      //Iterate over all the promises.
      //The resolved values will be
      //in an array, which gets provided
      //to the then() callback.
      Promise.all(promises)
        .then(fileNames => {
          return new Promise((resolve, reject) => {

            //We must build a path to interpolate
            //into the output Pug file.  If this is
            //a regular file, we can just replace
            //after the last slash in the path
            //with the file name.
            reqs.forEach((reqObj, i) => {

              let outPath;
              if(!/data:image/.test(fileNames[i])) {
                let pathArr = reqObj.filePath.split(path.sep);
                pathArr[pathArr.length-1] = fileNames[i];
                outPath = options.outputPath ? options.outputPath + fileNames[i] : pathArr.join(path.sep);
              }

              //Otherwise, it's a data URL, so we
              //just use it unmodified.
              else {
                outPath = fileNames[i];
              }

              //Replace pal() call with appropriate
              //result.
              content = content.replace(reqObj.palStmt, outPath);
            });
            return resolve(content)
          })
          .then(out => {
            //Call back with the final
            //string to be output - the
            //Pug file with all pal()
            //calls replaced.
            localCallback(out);
          })
          .catch(err => {
            //TODO?
          })
        })
        .catch(err => {
          //TODO?
        })
    })(
      //Invoke function, catch output
      //string and pass it to Webpack
      //callback.
      out => {
      callback(null, out);
    });

    //This is here because Webpack recommends
    //returning undefined when using this.async().
    return;
}
