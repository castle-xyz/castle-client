import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { DevelopmentContext } from '~/contexts/DevelopmentContext';

import DevelopmentLogs from '~/components/game/DevelopmentLogs';

const STYLES_LOG_CONTAINER = css`
  background: ${Constants.colors.background};
  width: 100%;
  display: flex;
  height: 172px;
  min-height: 96px;
  flex-direction: column;
`;

export default class GameActionsBar extends React.Component {
  static contextType = DevelopmentContext;

  _renderDeveloping = (game) => {
    return (
      <div className={STYLES_LOG_CONTAINER}>
        <DevelopmentLogs
          logs={this.context.logs}
          onClearLogs={this.context.setters.clearLogs}
          game={game}
        />
      </div>
    );
  };

  render() {
    let { game } = this.props;
    if (this.context.isDeveloping) {
      return this._renderDeveloping(game);
    }

    return null;
  }
}
