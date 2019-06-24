import * as React from 'react';
import * as Constants from '~/common/constants';

import UIGameCell from '~/components/reusable/UIGameCell';

import { css } from 'react-emotion';

const STYLES_CONTAINER = css`
  display: flex;
  flex-direction: column;
`;

const STYLES_GAME_ROW = css`
  display: flex;
  flex-direction: row;
  flex-wrap: no-wrap;
  margin-bottom: 8px;
  margin-left: 20px;
`;

const STYLES_CELL_ITEM = css``;

export default class UIGameSet extends React.Component {
  static defaultProps = {
    renderAsGrid: false,
    numRowsToElide: -1,
  };

  state = {
    width: null,
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this._handleResize);
  }

  componentDidMount() {
    window.addEventListener('resize', this._handleResize);
    this._handleResize();
  }

  _handleResize = () => {
    const width = this._containerRef.offsetWidth;
    this.setState({ width });
  };

  _maxNumGamesPerRow() {
    return Math.floor((this.state.width - 24) / (parseInt(Constants.card.width, 10) + 8));
  }

  _totalNumRows() {
    if (this.props.numRowsToElide == -1) {
      const totalNumGames = this.props.gameItems.length;
      let maxNumGamesPerRow = this._maxNumGamesPerRow();
      let numRows = Math.floor(totalNumGames / maxNumGamesPerRow);
      let remainder = totalNumGames % maxNumGamesPerRow;
      if (remainder > 0) {
        numRows += 1;
      }
      return numRows;
    } else {
      return this.props.numRowsToElide;
    }
  }

  _gamesForRow = (whichRow) => {
    const num = this._maxNumGamesPerRow();
    const startIdx = whichRow * num;
    return this.props.gameItems.slice(startIdx, startIdx + num);
  };

  render() {
    let rowIndices = [];
    for (let i = 0; i < this._totalNumRows(); i++) {
      rowIndices.push(i);
    }
    return (
      <div
        className={STYLES_CONTAINER}
        ref={(c) => {
          this._containerRef = c;
        }}>
        {rowIndices.map((_, j) => {
          return (
            <div className={STYLES_GAME_ROW} key={`${j}-whichRow`}>
              {this._gamesForRow(j).map((m, i) => {
                const key = m.key ? m.key : m.gameId ? m.gameId : m.url;
                return (
                  <div className={STYLES_CELL_ITEM} key={`${key}-i`}>
                    <UIGameCell
                      renderCartridgeOnly={this.props.renderCartridgeOnly}
                      onGameSelect={this.props.onGameSelect}
                      onShowGameInfo={this.props.onShowGameInfo}
                      underConstruction={this.props.underConstruction}
                      onGameUpdate={this.props.onGameUpdate}
                      onUserSelect={this.props.onUserSelect}
                      onSignInSelect={this.props.onSignInSelect}
                      src={m.coverImage && m.coverImage.url}
                      game={m}
                      viewer={this.props.viewer}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
}
