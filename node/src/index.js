const actions = [require('./actions/publishProject')];

async function runAsync() {
  let unbase64;
  let input;
  try {
    unbase64 = Buffer.from(process.argv[2], 'base64').toString();
  } catch (e) {
    console.log(e);
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
      console.log(JSON.stringify(response));
      return;
    }
  }

  throw new Error('no matching action');
}

runAsync()
  .catch((e) => {
    console.error(e.toString());
  })
  .then(() => {
    process.exit(0);
  });
