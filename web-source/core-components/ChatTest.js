import * as React from 'react';
import Pusher from 'pusher-js';

export default class ChatTest extends React.Component {
  componentWillMount() {
    var pusher = new Pusher('7881bbb9197f8e15a81f', {
      cluster: 'us2',
      forceTLS: true,
    });

    var channel = pusher.subscribe('my-channel');
    channel.bind('my-event', function(data) {
      alert(JSON.stringify(data));
    });
  }

  render() {
    return <div>test</div>;
  }
}
