let express = require('express');
let cors = require('cors');
let bodyParser = require('body-parser');

const secret = '' + Math.floor(Math.random() * 10000000000);
const app = express();
app.use(cors());
app.use(bodyParser.json());

const actions = [require('./actions/publishProject')];

let listener = app.listen(0, async () => {
  let port = listener.address().port;
  console.log(
    JSON.stringify({
      port,
      secret,
    })
  );
});

app.post('/exec', async (req, res) => {
  try {
    if (!req.body || !req.body.action || req.body.secret != secret) {
      throw new Error('bad request ' + req.body + '  ' + JSON.stringify(req.body));
    }

    for (let i = 0; i < actions.length; i++) {
      let action = actions[i];

      if (req.body.action === action.name) {
        let response = await action.fn(req.body.args);
        console.log(JSON.stringify(response));
        res.setHeader('content-type', 'application/json');
        res.status(200).send(response);
        return;
      }
    }

    throw new Error(`no action found for ${req.body.action}`);
  } catch (e) {
    res.status(500).send(e.message);
  }
});
