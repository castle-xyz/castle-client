var fs = require("fs");
var request = require("request");

var tokenFilename =
  process.env["DOWNLOADSECUREFILE_SECUREFILEPATH"] ||
  "../../ghost-secret/ci-secret-file.txt";

var token = fs.readFileSync(tokenFilename, "utf8");

request.post(
  {
    url: "https://api.castle.games/api/upload-client-release",
    headers: {
      "X-Auth-Token": token
    },
    qs: {
      platform: process.argv[2]
    },
    formData: {
      file: fs.createReadStream(process.argv[3])
    }
  },
  function(err, resp, body) {
    if (err) {
      console.log("Error!");
      process.exit(1);
    } else {
      console.log("Success!");
      process.exit(0);
    }
  }
);
