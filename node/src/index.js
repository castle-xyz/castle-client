const actions = [
  require('./actions/createDirectory'),
  require('./actions/extract'),
  require('./actions/getHomeDir'),
  require('./actions/getProjectFilenameAtPath'),
  require('./actions/publishProject'),
  require('./actions/test'),
  require('./actions/uploadScreenCapture'),
];

async function runAsync() {
  let unbase64;
  let input;
  try {
    unbase64 = Buffer.from(process.argv[2], 'base64').toString();
  } catch (e) {
    throw new Error(`error decoding base64 ${process.argv[2]}`);
  }

  try {
    input = JSON.parse(unbase64);
  } catch (e) {
    throw new Error(`error parsing json arg ${unbase64}`);
  }

  for (let i = 0; i < actions.length; i++) {
    let action = actions[i];

    if (input.action === action.name) {
      let response = await action.fn(input.args);
      console.log(new Buffer(JSON.stringify(response)).toString('base64'));
      return;
    }
  }

  throw new Error(`no matching action for ${input.action}`);
}

runAsync()
  .catch((e) => {
    console.log(new Buffer(e.toString()).toString('base64'));
  })
  .then(() => {
    process.exit(0);
  });
