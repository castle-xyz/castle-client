let fs = require('fs');
let CastleApiClient = require('castle-api-client');
let FormData = require('form-data');

global.FormData = FormData;
global.Blob = fs.ReadStream;

function getBlobForFilename(filename) {
  let f = fs.createReadStream(filename);
  f.__proto__ = Blob.prototype;
  return f;
}

async function uploadScreenCapture(API, { file }) {
  const variables = { file };
  const result = await API.graphqlAsync({
    query: `
      mutation($file: Upload!) {
        uploadScreenCapture(file: $file)
      }
    `,
    variables,
  });

  if (result.error || result.errors || !result.data) {
    throw new Error('failed to upload screen capture ' + JSON.stringify(result));
  }

  return result.data.uploadScreenCapture;
}

async function uploadScreenCaptureAsync(args) {
  let path = args.path;
  let apiHost = args.apiHost;
  let token = args.token;

  let API = CastleApiClient(apiHost);
  await API.client.setTokenAsync(token);

  return await uploadScreenCapture(API, {
    file: getBlobForFilename(path),
  });
}

module.exports = {
  name: 'uploadScreenCapture',
  fn: uploadScreenCaptureAsync,
};
