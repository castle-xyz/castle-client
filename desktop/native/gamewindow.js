import { NativeBinds } from '~/native/nativebinds';
import UserStatus from '~/common/userstatus';
import Share from '~/common/share';

class GameWindow {
  _isOpen = false;
  _currentGame = null;

  open = async (gameUrl, game) => {
    if (this._isOpen) return;
    this._isOpen = true;
    this._currentGame = game;
    amplitude.getInstance().logEvent('OPEN_LUA', {
      gameUrl,
    });
    Share.addEventListeners(game);
    UserStatus.startAsync(game);
    await NativeBinds.setSystemScalingEnabled({
      isSystemScalingEnabled: !(game.metadata && game.metadata.disableSystemScaling),
    });
    await NativeBinds.openUri({ uri: gameUrl });
  };

  setVisible = async (isVisible) => {
    if (!this._isOpen) return;
    await NativeBinds.setWindowFrameVisible({ isVisible });
  };

  updateFrame = async (rect) => {
    if (!this._isOpen) return;
    await NativeBinds.setChildWindowFrame({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  close = async () => {
    if (this._isOpen) {
      UserStatus.stop();
      Share.removeEventListeners();
      await NativeBinds.close();
      this._isOpen = false;
      this._currentGame = null;
    }
  };

  getCurrentGame = () => {
    return this._isOpen ? this._currentGame : null;
  };
}

export default new GameWindow();
