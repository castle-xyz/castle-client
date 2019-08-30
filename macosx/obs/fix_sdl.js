#!/usr/bin/env node

let fs = require("fs");
let path = require("path");
let child_process = require("child_process");

function otoolOutputList(filename) {
  let output = child_process.execSync("otool -L " + filename).toString();
  output = output.split("\n");
  let results = [];
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

    results.push(line.split(" (")[0]);
  }

  return results;
}

function updateSDL() {
  let files = fs.readdirSync("bin").map(file => {
    return "bin/" + file;
  });

  files.forEach(file => {
    let deps = otoolOutputList(file);

    if (deps.includes("@rpath/libSDL2-2.0.0.dylib")) {
      child_process.execSync(
        "install_name_tool -change @rpath/libSDL2-2.0.0.dylib @rpath/SDL2.framework/Versions/A/SDL2 " +
          file
      );
    }
  });
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
    // Don't do this for bin, because it sets libobs.0.dylib id to libobs.dylib because of the symlink
    if (dir == "libs") {
      child_process.execSync(
        "install_name_tool -id @rpath/" + file + " " + dir + "/" + file
      );
    }

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

try {
  child_process.execSync("rm bin/libSDL2-2.0.0.dylib");
} catch (e) {}
updateSDL();
