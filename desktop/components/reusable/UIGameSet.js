import * as React from 'react';
import * as Constants from '~/common/constants';

import UIGameCell from '~/components/reusable/UIGameCell';

import { css } from 'react-emotion';
import { NavigatorContext } from '~/contexts/NavigationContext';

const STYLES_CONTAINER = css`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 8px;
  margin-left: 24px;
`;

const STYLES_CELL_ITEM = css`
  margin: 0 16px 16px 0;
`;

class UIGameSet extends React.Component {
  _container;

  static defaultProps = {
    numRowsToElide: -1,
  };

  _openGameMetaScreen = async (game) => {
    this.props.navigateToGameMeta(game);
  };

  _numGamesToRender = () => {
    const { numRowsToElide, gameItems } = this.props;
    if (numRowsToElide > 0) {
      let numGamesPerRow = 0;
      if (this._container) {
        numGamesPerRow = Math.floor(
          this._container.offsetWidth / (parseInt(Constants.card.width, 10) + 16)
        );
      }
      return Math.max(1, numGamesPerRow * numRowsToElide);
    }
    return gameItems && gameItems.length;
  };

  render() {
    if (!this.props.gameItems) return null;

    let itemsToRender = this.props.gameItems;
    if (this.props.numRowsToElide > 0) {
      itemsToRender = this.props.gameItems.slice(0, this._numGamesToRender());
    }
    return (
      <div className={STYLES_CONTAINER} ref={(c) => (this._container = c)}>
        {itemsToRender.map((m, i) => {
          const key = m.key ? m.key : m.gameId ? m.gameId : m.url;
          return (
            <div className={STYLES_CELL_ITEM} key={`${key}-${i}`}>
              <UIGameCell
                onGameSelect={this.props.onGameSelect}
                onShowGameInfo={() => this._openGameMetaScreen(m)}
                onGameUpdate={this.props.onGameUpdate}
                onUserSelect={this.props.onUserSelect}
                src={m.coverImage && m.coverImage.url}
                game={m}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default class UIGameSetWithContext extends React.Component {
  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <UIGameSet navigateToGameMeta={navigator.navigateToGameMeta} {...this.props} />
        )}
      </NavigatorContext.Consumer>
    );
  }
}
