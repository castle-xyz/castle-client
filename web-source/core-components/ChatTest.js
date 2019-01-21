import * as React from 'react';
import Pusher from 'pusher-js';
import * as Constants from '~/common/constants';
import * as Actions from '~/common/actions';

import { css } from 'react-emotion';

const STYLES_CHAT = css`
  white-space: pre-line;
`;

export default class ChatTest extends React.Component {
  state = {
    text: '',
  };

  addText(text) {
    this.setState({
      text: this.state.text + '\n' + text,
    });
  }

  async initPusher() {
    let pusher = new Pusher('7881bbb9197f8e15a81f', {
      cluster: 'us2',
      forceTLS: true,
      authEndpoint: Constants.API_HOST + '/api/pusher/auth',
      auth: {
        headers: await Actions.getHeadersAsync(),
      },
    });

    let channel = pusher.subscribe('presence-my-channel');
    channel.bind('my-event', data => {
      this.addText('event: ' + JSON.stringify(data));
    });

    pusher.connection.bind('error', err => {
      this.addText('error: ' + JSON.stringify(err));
    });

    pusher.connection.bind('state_change', states => {
      this.addText('state change: ' + states.current);
    });
  }

  componentWillMount() {
    this.initPusher();
  }

  render() {
    return <div className={STYLES_CHAT}>{this.state.text}</div>;
  }
}
