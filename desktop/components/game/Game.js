import * as React from 'react';
import * as Strings from '~/common/strings';
import * as NativeUtil from '~/native/nativeutil';
import * as URLS from '~/common/urls';
import * as Utilities from '~/common/utilities';
import * as Bridge from '~/common/bridge';
import * as ScreenCapture from '~/common/screencapture';

import { css } from 'react-emotion';
import { DevelopmentContext } from '~/contexts/DevelopmentContext';

import GameScreenActionsBar from '~/components/game/GameScreenActionsBar';
import GameScreenAlert from '~/components/game/GameScreenAlert';
import GameScreenDeveloperSidebar from '~/components/game/GameScreenDeveloperSidebar';
import GameScreenLayout from '~/components/game/GameScreenLayout';
import GameScreenSidebar from '~/components/game/GameScreenSidebar';
import GameScreenWindowHeader from '~/components/game/GameScreenWindowHeader';

export default class Game extends React.Component {
  static contextType = DevelopmentContext;

  state = {
    isToolsVisible: false,
  };

  static defaultProps = {
    errorMessage: '',
  };

  componentDidMount() {
    window.addEventListener('CASTLE_TOOLS_UPDATE', this._handleToolsUpdate);
    NativeUtil.sendLuaEvent('CASTLE_TOOLS_NEEDS_SYNC', {});
  }

  componentWillUnmount() {
    window.removeEventListener('CASTLE_TOOLS_UPDATE', this._handleToolsUpdate);
  }

  _handleToolsUpdate = (e) => {
    if (this.state.isToolsVisible) {
      return;
    }

    const state = JSON.parse(e.params);

    let isToolsVisible = false;
    if (state.panes) {
      isToolsVisible = !!Object.values(state.panes).find(
        (element) => element.children && element.children.count > 0
      );
    }

    this.setState({ isToolsVisible });
  };

  _handleViewSource = (entry) => {
    NativeUtil.openExternalURL(URLS.githubUserContentToRepoUrl(entry));
  };

  _handlePostScreenshot = async () => {
    await Bridge.JS.postCreate({
      message: 'I took a screenshot!',
      mediaType: 'capture',
      mediaUploadParams: { autoCrop: true },
    });
  };

  _handleToggleDeveloper = () => {
    this.context.setters.toggleIsDeveloping();
  };

  render() {
    const entryPoint = Utilities.getLuaEntryPoint(this.props.game);
    const isOpenSource = URLS.isOpenSource(entryPoint);

    const elementActions = (
      <GameScreenActionsBar
        game={this.props.game}
        sessionId={this.props.sessionId}
        isMuted={this.props.isMuted}
        onToggleMute={this.props.onToggleMute}
        onPostScreenshot={this._handlePostScreenshot}
        onPostScreenCapture={ScreenCapture.takeScreenCaptureAsync}
        onViewSource={isOpenSource ? () => this._handleViewSource(entryPoint) : null}
        onViewDeveloper={this._handleToggleDeveloper}
      />
    );

    let maybeElementAlert;
    if (!Strings.isEmpty(this.props.errorMessage)) {
      maybeElementAlert = <GameScreenAlert>{this.props.errorMessage}</GameScreenAlert>;
    }

    let maybeElementDeveloper;
    if (this.context.isDeveloping) {
      maybeElementDeveloper = (
        <GameScreenDeveloperSidebar
          onWindowSizeUpdate={this.props.onWindowSizeUpdate}
          isMultiplayerCodeUploadEnabled={this.context.isMultiplayerCodeUploadEnabled}
          setters={this.context.setters}
          logs={this.context.logs}
          game={this.props.game}
          onReload={this.props.onReload}
        />
      );
    }

    let maybeElementSidebar;
    if (this.state.isToolsVisible) {
      maybeElementSidebar = (
        <GameScreenSidebar
          onSetToolsRef={this.props.onSetToolsRef}
          onWindowSizeUpdate={this.props.onWindowSizeUpdate}
          game={this.props.game}
        />
      );
    }

    const elementHeader = (
      <GameScreenWindowHeader
        onGameMinimize={this.props.onGameMinimize}
        onGameMaximize={this.props.onGameMaximize}
        onGameDismiss={this.props.onGameDismiss}
      />
    );

    return (
      <GameScreenLayout
        elementActions={elementActions}
        elementAlert={maybeElementAlert}
        elementDeveloper={maybeElementDeveloper}
        elementGameSidebar={maybeElementSidebar}
        elementHeader={elementHeader}
        onWindowSizeUpdate={this.props.onWindowSizeUpdate}>
        {this.props.children}
      </GameScreenLayout>
    );
  }
}
