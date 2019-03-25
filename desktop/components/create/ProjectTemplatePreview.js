import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';

const STYLES_CONTAINER = css`
  background-color: ${Constants.colors.background3};
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
`;

const STYLES_INFO = css`
  width: 100%;
`;

const STYLES_HEADING = css`
  font-size: ${Constants.typescale.lvl7};
  line-height ${Constants.typescale.lvl7};
  color: ${Constants.colors.text};
`;

const STYLES_TITLE = css`
  font-size: ${Constants.typescale.lvl6};
  line-height ${Constants.typescale.lvl6};
  color: ${Constants.colors.text};
  font-weight: 700;
  margin-bottom: 16px;
`;

const STYLES_PARAGRAPH = css`
  font-size: ${Constants.typescale.lvl6};
  line-height ${Constants.typescale.lvl6};
  color: ${Constants.colors.text};
`;

const STYLES_GAME_COVER = css`
  background-size: cover;
  background-position: 50% 50%;
  height: 108px;
  width: 160px;
  flex-shrink: 0;
  margin-right: 16px;
`;

export default class ProjectTemplatePreview extends React.Component {
  static defaultProps = {
    template: null,
  };

  render() {
    const { template } = this.props;
    const coverSrc = template.coverImage ? template.coverImage.imgixUrl : null;
    return (
      <div className={STYLES_CONTAINER}>
        <div
          className={STYLES_GAME_COVER}
          style={{ backgroundImage: coverSrc ? `url(${coverSrc})` : null }}
        />
        <div className={STYLES_INFO}>
          <div className={STYLES_TITLE}>Your chosen template: {this.props.template.title}</div>
          <div className={STYLES_PARAGRAPH}>
            Castle will create your project with some basic code and assets from this template. What
            happens next is up to you!
          </div>
        </div>
      </div>
    );
  }
}
