let fs = require('fs');
let path = require('path');
let crypto = require('crypto');
let CastleApiClient = require('castle-api-client');
let FormData = require('form-data');
const packlist = require('npm-packlist');

global.FormData = FormData;
global.Blob = fs.ReadStream;

async function md5Async(filename) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filename)
      .pipe(crypto.createHash('sha1').setEncoding('hex'))
      .once('finish', function() {
        resolve(this.read());
      })
      .once('error', reject);
  });
}

function getBlobForFilename(filename) {
  let f = fs.createReadStream(filename);
  f.__proto__ = Blob.prototype;
  return f;
}

async function listOfFilesAsync(dir) {
  return await packlist({ path: dir });
}

async function publishHostedGame(API, { gameFiles }) {
  const variables = { gameFiles };
  const result = await API.graphqlAsync({
    query: `
      mutation($gameFiles: [GameFile]!) {
        publishHostedGame(gameFiles: $gameFiles)
      }
    `,
    variables,
  });

  // TODO(jim): Write a global error handler.
  if (result.error || result.errors || !result.data) {
    return false;
  }

  return result.data.publishHostedGame;
}

async function publishProjectAsync(args) {
  args = {
    dir: '/Users/jesseruder/ghost/projects/procjam-tower-defense/',
    apiHost: 'http://localhost:1380',
    token: '0350580d-317b-47eb-9107-88496142653a',
    previousHashes: {
      '5fd401faa80cb3f4624e2697b4e4d1748d1bb5e1': 1,
      a5fccab6ad3ed4290f072028f841ebb76452b724: 1,
      '61cd1f9715246c651f17574d63e5528810e8ac34': 1,
      a1d3aa85c0175ea4c103c53eef0ab291a8b76bd6: 1,
      '540293cb92580184677279c86fb0881321a99d3c': 1,
      da39a3ee5e6b4b0d3255bfef95601890afd80709: 1,
      '76d0a64a67e39bd962731666fc409ed2341f065c': 1,
      c894584a4147b0113549684924e7c521ed4f2aaa: 1,
      '9faf8c5e502c756ba4f279fc1f96802787fbf239': 1,
      e5a697f8470a17a0f78d3d898e2f42025badbbd7: 1,
      db5c68383e89437cc75f9273acfea14c01f7f8cd: 1,
      '864b05cdeb217b1e6ea3aa86dfa79b2992180863': 1,
      '94b2914ec78e2aca4acd1ea7cb2ec6434cc05dcd': 1,
    },
  };

  let dir = args.dir;
  let apiHost = args.apiHost;
  let token = args.token;
  let previousHashes = args.previousHashes;

  let API = CastleApiClient(apiHost);
  await API.client.setTokenAsync(token);

  let files = await listOfFilesAsync(dir);
  let filesToHashes = {};
  await Promise.all(
    files.map(async (filename) => {
      filesToHashes[filename] = await md5Async(path.resolve(dir, filename));
    })
  );

  return await publishHostedGame(API, {
    gameFiles: files.map((filename) => {
      if (previousHashes[filesToHashes[filename]]) {
        // we know server has already seen this file. don't upload
        return {
          path: filename,
          hash: filesToHashes[filename],
        };
      } else {
        return {
          path: filename,
          file: getBlobForFilename(path.resolve(dir, filename)),
        };
      }
    }),
  });
}

module.exports = {
  name: 'publishProject',
  fn: publishProjectAsync,
};
