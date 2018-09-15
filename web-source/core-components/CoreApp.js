import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Fixtures from '~/common/fixtures';

import { css } from 'react-emotion';
import { isKeyHotkey } from 'is-hotkey';

import CoreLayout from '~/core-components/layouts/CoreLayout';
import CoreMediaScreen from '~/core-components/CoreMediaScreen';
import CoreBrowserHeader from '~/core-components/CoreBrowserHeader';
import CoreBrowserURLInput from '~/core-components/CoreBrowserURLInput';
import CoreNavigationSidebar from '~/core-components/CoreNavigationSidebar';
import CoreGameInfo from '~/core-components/CoreGameInfo';
import CoreUserDashboard from '~/core-components/CoreUserDashboard';
import CoreScoreInfo from '~/core-components/CoreScoreInfo';
import CoreToolbar from '~/core-components/CoreToolbar';

const isOverlayHotkey = isKeyHotkey('mod+e');

export default class CoreApp extends React.Component {
  _layout;

  constructor(props) {
    super();

    this.state = props.state;
  }

  componentDidMount() {
    window.addEventListener('keydown', this._handleKeyDown);
    // window.addEventListener('resize', this._handleSetGameWindowSize);

    this._handleSetGameWindowSize();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this._handleKeyDown);
    // window.removeEventListener('resize'.this._handleSetGameWindowSize);
  }

  _handleSetGameWindowSize = () => {
    const element = this._layout.getMediaContainerRef();
    const rect = element.getBoundingClientRect();

    try {
      window.cefQuery({
        request: JSON.stringify({
          type: 'SET_CHILD_WINDOW_FRAME',
          body: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
        }),
      });
    } catch (e) {
      alert('`cefQuery`: ' + e.message);
    }
  };

  _handleKeyDown = e => {
    if (isOverlayHotkey(e)) {
      return this._handleToggleOverlay();
    }
  };

  _handleToggleAuthentication = () => {
    this.setState(
      { viewer: this.state.viewer ? null : Fixtures.User },
      this._handleSetGameWindowSize
    );
  };

  _handleURLChange = e => this.setState({ [e.target.name]: e.target.value });

  _handleURLSubmit = () => {
    try {
      window.cefQuery({
        request: JSON.stringify({
          type: 'OPEN_URI',
          body: {
            uri: this.state.url,
          },
        }),
      });
    } catch (e) {
      alert('`cefQuery`: ' + e.message);
    }
  };

  _handleToggleSearch = () => window.alert('search');
  _handleToggleProfile = () => window.alert('profile');
  _handleNextMedia = () => window.alert('next');
  _handlePreviousMedia = () => window.alert('previous');
  _handleRandomMedia = () => window.alert('random');
  _handleRegisterGame = () => window.alert('register');
  _handleFavoriteMedia = () => window.alert('favorite');
  _handleShareScores = () => window.alert('score share');

  _handleToggleScore = () => {
    this.setState({ isScoreVisible: !this.state.isScoreVisible }, this._handleSetGameWindowSize);
  };

  _handleToggleDashboard = () => {
    this.setState(
      {
        isMediaInfoVisible: false,
        isDashboardVisible: !this.state.isDashboardVisible,
      },
      this._handleSetGameWindowSize
    );
  };

  _handleToggleMediaInfo = () => {
    this.setState(
      {
        isMediaInfoVisible: !this.state.isMediaInfoVisible,
        isDashboardVisible: false,
      },
      this._handleSetGameWindowSize
    );
  };

  _handleDismissMediaInfo = () => {
    this.setState({ isMediaInfoVisible: false }, this._handleSetGameWindowSize);
  };

  _handleDismissDashboard = () => {
    this.setState({ isDashboardVisible: false }, this._handleSetGameWindowSize);
  };

  _handleDismissScore = () => {
    this.setState({ isScoreVisible: false }, this._handleSetGameWindowSize);
  };

  _handleHideOverlay = () => {
    this.setState({ isOverlayActive: false }, this._handleSetGameWindowSize);
  };

  _handleToggleOverlay = () => {
    this.setState({ isOverlayActive: !this.state.isOverlayActive }, this._handleSetGameWindowSize);
  };
  _handleToggleMediaExpanded = () => {
    this.setState({ isMediaExpanded: !this.state.isMediaExpanded }, this._handleSetGameWindowSize);
  };

  render() {
    // NOTE(jim): For example purposes, state can be stubbed out from anywhere.
    const { state } = this;

    let maybeBottomNode;
    if (state.isOverlayActive) {
      maybeBottomNode = (
        <CoreBrowserURLInput
          name="url"
          value={state.url}
          viewer={state.viewer}
          expanded={state.isMediaExpanded}
          onURLChange={this._handleURLChange}
          onURLSubmit={this._handleURLSubmit}
          onToggleMediaExpanded={this._handleToggleMediaExpanded}
          onHideOverlay={this._handleHideOverlay}
          onFavoriteMedia={this._handleFavoriteMedia}
        />
      );
    }

    let maybeTopNode;
    if (state.isOverlayActive) {
      maybeTopNode = (
        <CoreBrowserHeader
          viewer={state.viewer}
          onToggleDashboard={this._handleToggleDashboard}
          onToggleAuthentication={this._handleToggleAuthentication}
          onToggleMediaInfo={this._handleToggleMediaInfo}
          onToggleScores={this._handleToggleScore}
        />
      );
    }

    let maybeLeftSidebarNode;
    if (state.isOverlayActive && state.viewer) {
      maybeLeftSidebarNode = (
        <CoreNavigationSidebar
          viewer={state.viewer}
          onToggleProfile={this._handleToggleProfile}
          onToggleSearch={this._handleToggleSearch}
        />
      );
    }

    let maybeRightSidebarNode;
    if (state.isOverlayActive && state.isScoreVisible) {
      maybeRightSidebarNode = (
        <CoreScoreInfo
          onDismiss={this._handleDismissScore}
          onShareScores={this._handleShareScores}
        />
      );
    }

    let maybeRightNode;
    if (state.isOverlayActive && state.isMediaInfoVisible) {
      maybeRightNode = (
        <CoreGameInfo
          onDismiss={this._handleDismissMediaInfo}
          onRegisterMedia={this._handleRegisterGame}
          onNextMedia={this._handleNextMedia}
          onRandomMedia={this._handleRandomMedia}
          onPreviousMedia={this._handlePreviousMedia}
        />
      );
    }

    if (state.isOverlayActive && state.isDashboardVisible) {
      maybeRightNode = (
        <CoreUserDashboard
          onDismiss={this._handleDismissDashboard}
          onNextMedia={this._handleNextMedia}
          onRandomMedia={this._handleRandomMedia}
          onPreviousMedia={this._handlePreviousMedia}
        />
      );
    }

    if (state.isOverlayLayout) {
      return (
        <CoreLayoutOverlay
          topNode={maybeTopNode}
          bottomNode={maybeBottomNode}
          toolbarNode={maybeToolbarNode}
          leftSidebarNode={maybeLeftSidebarNode}
          rightSidebarNode={maybeRightSidebarNode}
          rightNode={maybeRightNode}>
          <CoreMediaScreen expanded={state.isMediaExpanded} />
        </CoreLayoutOverlay>
      );
    }

    return (
      <CoreLayout
        ref={reference => {
          this._layout = reference;
        }}
        topNode={maybeTopNode}
        bottomNode={maybeBottomNode}
        leftSidebarNode={maybeLeftSidebarNode}
        rightSidebarNode={maybeRightSidebarNode}
        rightNode={maybeRightNode}>
        <CoreMediaScreen expanded={state.isMediaExpanded} />
      </CoreLayout>
    );
  }
}
