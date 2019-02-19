import * as Actions from '~/common/actions';
import * as NativeUtil from '~/native/nativeutil';

class Share {
  addEventListeners = (game) => {
    window.addEventListener(
      'CASTLE_CONNECT_MULTIPLAYER_CLIENT_REQUEST',
      this._connectMultiplayerClientAsync
    );

    this._game = game;
    this._sessionId = game ? game.sessionId : null;
  };

  removeEventListeners = () => {
    window.removeEventListener(
      'CASTLE_CONNECT_MULTIPLAYER_CLIENT_REQUEST',
      this._connectMultiplayerClientAsync
    );

    this._game = null;
    this._sessionId = null;
  };

  _connectMultiplayerClientAsync = async (e) => {
    let mediaUrl = e.params.mediaUrl;
    let response = await Actions.multiplayerJoinAsync(mediaUrl, this._sessionId);

    NativeUtil.sendLuaEvent('CASTLE_CONNECT_MULTIPLAYER_CLIENT_RESPONSE', {
      address: response.address,
    });

    if (response.sessionId && this._game) {
      let message;
      if (response.sessionId === this._sessionId) {
        message = `You joined session ${this._game.url}#${response.sessionId}`;
      } else {
        message = `You created session ${this._game.url}#${response.sessionId}`;
      }

      let event = new Event('CASTLE_ADD_CHAT_NOTIFICATION');
      event.params = {
        message,
      };
      window.dispatchEvent(event);
    }
  };
}

export default new Share();
