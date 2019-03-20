import * as React from 'react';
import { css } from 'react-emotion';

const STYLES_CONTAINER = css`
  display: flex;
  flex-wrap: wrap;
  padding: 0 8px 0 8px;
`;

const STYLES_TEMPLATE_CONTAINER = css`
  display: inline-block;
  padding: 8px;
  margin-bottom: 8px;
`;

const STYLES_GAME_COVER = css`
  background-size: cover;
  background-position: 50% 50%;
  width: 192px;
  height: 108px;
`;

export default class ProjectTemplateChooser extends React.Component {
  static defaultProps = {
    templates: [],
  };

  _renderTemplate = (game) => {
    const coverSrc = game.coverImage ? game.coverImage.imgixUrl : null;
    return (
      <div id={game.id} className={STYLES_TEMPLATE_CONTAINER}>
        <div
          className={STYLES_GAME_COVER}
          onClick={() => this.props.onGameSelect(game)}
          style={{ backgroundImage: coverSrc ? `url(${coverSrc})` : null }}
        />
        {game.title}
      </div>
    );
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        {this.props.templates.slice(0, 9).map((game) => this._renderTemplate(game))}
      </div>
    );
  }
}
