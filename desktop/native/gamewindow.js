import { NativeBinds } from '~/native/nativebinds';
import UserStatus from '~/common/userstatus';

class GameWindow {
  _isOpen = false;
  _currentGame = null;
  _navigations = null;
  _openCallbacks = [];
  _closeCallbacks = [];
  _setRecordingStatus = null;

  open = async ({ gameUrl, game, initialData, navigations, screenSettings }) => {
    if (this._isOpen) return;
    this._isOpen = true;
    this._currentGame = game;
    this._navigations = navigations;
    for (let callback of this._openCallbacks) {
      callback(this._currentGame);
    }
    UserStatus.startAsync(game);
    if (screenSettings) {
      await NativeBinds.setScreenSettings(screenSettings);
    }
    await NativeBinds.openUri({ uri: gameUrl, initialData: JSON.stringify(initialData) });
  };

  setVisible = async (isVisible) => {
    if (!this._isOpen) return;
    await NativeBinds.setWindowFrameVisible({ isVisible });
  };

  updateFrame = async (rect) => {
    // NOTE: Don't need `this._isOpen` to be true here -- native keeps track of early updates...
    await NativeBinds.setChildWindowFrame({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  updateSetRecordingStatus = (setRecordingStatus) => {
    this._setRecordingStatus = setRecordingStatus;
  };

  close = async () => {
    if (this._isOpen) {
      UserStatus.stop();
      for (let callback of this._closeCallbacks) {
        callback(this._currentGame);
      }
      await NativeBinds.close();
      this._isOpen = false;
      this._currentGame = null;
      this._navigations = null;
    }
  };

  getCurrentGame = () => {
    return this._isOpen ? this._currentGame : null;
  };

  getNavigations = () => {
    return this._navigations;
  };

  onOpen = (callback) => {
    this._openCallbacks.push(callback);
  };

  onClose = (callback) => {
    this._closeCallbacks.push(callback);
  };

  setRecordingStatus = (status) => {
    this._setRecordingStatus(status);
  };
}

export default new GameWindow();
