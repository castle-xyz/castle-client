import * as React from 'react';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import * as Utilities from '~/common/utilities';

import { css } from 'react-emotion';
import { DevelopmentContext } from '~/contexts/DevelopmentContext';

import DevelopmentLogs from '~/components/game/DevelopmentLogs';
import UINavigationLink from '~/components/reusable/UINavigationLink';

const STYLES_LOG_CONTAINER = css`
  background: #020202;
  width: 100%;
  display: flex;
  height: 172px;
  min-height: 96px;
  flex-direction: column;
`;

export default class GameActionsBar extends React.Component {
  static contextType = DevelopmentContext;

  _handleViewSource = (gameEntryPoint) => {
    NativeUtil.openExternalURL(Urls.githubUserContentToRepoUrl(gameEntryPoint));
  };

  render() {
    let { game } = this.props;

    let maybeViewSourceElement;
    const entryPoint = Utilities.getLuaEntryPoint(game);
    if (Urls.isOpenSource(entryPoint)) {
      maybeViewSourceElement = (
        <UINavigationLink
          style={{ marginRight: 24 }}
          onClick={() => this._handleViewSource(entryPoint)}>
          View Source
        </UINavigationLink>
      );
    }

    if (this.context.isDeveloping) {
      return (
        <div
          className={STYLES_LOG_CONTAINER}
          style={
            !this.props.isVisible
              ? {
                  opacity: 0,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: 1,
                  width: 1,
                  pointerEvents: 'none',
                }
              : null
          }>
          <DevelopmentLogs
            logs={this.context.logs}
            onClearLogs={this.context.setters.clearLogs}
            viewSourceElement={maybeViewSourceElement}
            game={game}
          />
        </div>
      );
    }

    return null;
  }
}
