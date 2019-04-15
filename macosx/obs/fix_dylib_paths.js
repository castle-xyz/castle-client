#!/usr/bin/env node

let fs = require("fs");
let path = require("path");
let child_process = require("child_process");

function otoolOutputList(filename) {
  let output = child_process.execSync("otool -L " + filename).toString();
  output = output.split("\n");
  let results = {};
  for (let i = 0; i < output.length; i++) {
    let line = output[i].trim();
    if (line.length === 0) {
      continue;
    }

    if (line.endsWith(":")) {
      continue;
    }

    if (line.startsWith("/System/")) {
      continue;
    }

    if (line.startsWith("/usr/lib/")) {
      continue;
    }

    if (line.startsWith("@")) {
      continue;
    }

    results[line.split(" (")[0]] = true;
  }

  return results;
}

function depsForFiles(files) {
  let results = {};

  files.forEach(file => {
    let dirResults = otoolOutputList(file);
    Object.keys(dirResults).forEach(key => {
      results[key] = true;
    });
  });

  return results;
}

function depsForDir(dir) {
  return depsForFiles(
    fs.readdirSync(dir).map(file => {
      return dir + "/" + file;
    })
  );
}

function fixDir(dir) {
  // copy all files
  let deps = depsForDir(dir);
  let didSomething = true;

  while (didSomething) {
    let newFiles = [];
    didSomething = false;

    Object.keys(deps).forEach(filename => {
      let newFilename = "libs/" + path.basename(filename);
      if (!fs.existsSync(newFilename)) {
        console.log("copying " + filename);
        fs.copyFileSync(filename, newFilename);
        newFiles.push(newFilename);
        child_process.execSync("chmod 777 " + newFilename);

        didSomething = true;
      }
    });

    deps = depsForFiles(newFiles);
  }

  // fix them up
  fs.readdirSync(dir).forEach(file => {
    let dirResults = otoolOutputList(dir + "/" + file);
    child_process.execSync(
      "install_name_tool -id @rpath/" + file + " " + dir + "/" + file
    );

    Object.keys(dirResults).forEach(key => {
      child_process.execSync(
        "install_name_tool -change " +
          key +
          " @rpath/" +
          path.basename(key) +
          " " +
          dir +
          "/" +
          file
      );
    });
  });
}

// first get all the deps from bin files

fixDir("bin");
fixDir("libs");
