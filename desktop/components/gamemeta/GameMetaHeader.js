import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIHeading from '~/components/reusable/UIHeading';
import UIHorizontalNavigation from '~/components/reusable/UIHorizontalNavigation';

// TODO: audit styles

const STYLES_CONTAINER = css`
  background: ${Constants.colors.white};
  width: 100%;
`;

const STYLES_COVER = css`
  flex-shrink: 0;
  width: 90px;
  height: 90px;
  border-radius: 4px;
  background-size: cover;
  background-position: 50% 50%;
`;

const STYLES_BODY = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 16px 16px 24px;
`;

const STYLES_BODY_LEFT = css`
  color: ${Constants.colors.text};
  min-width: 25%;
`;

const STYLES_BODY_RIGHT = css`
  width: 25%;
`;

const STYLES_TOP = css`
  display: flex;
  margin-bottom: 24px;
`;

const STYLES_TITLE = css`
  font-size: 48px;
  line-height: 52px;
  font-weight: 400;
`;

const STYLES_META = css`
  font-family: ${Constants.font.system};
  margin: 4px 0 4px 0;
  font-size: 12px;
`;

const STYLES_ABOUT = css`
  line-height: 1.725;
  font-weight: 200;
  font-size: 16px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  padding: 0 24px 16px 16px;
`;

const STYLES_LINKS_ROW = css`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  margin-bottom: 16px;
`;

const STYLES_LINK_ITEM = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${Constants.colors.black};
  font-family: ${Constants.font.system};
  font-weight: 600;
  font-size: 12px;
  margin-right: 24px;
  cursor: pointer;

  span {
    margin-right: 0.3em;
  }

  :hover {
    span {
      text-decoration: underline;
    }
  }
`;

const STYLES_STATUS = css`
  margin-right: 8px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const STYLES_CREATOR_IDENTITY = css`
  margin-bottom: 16px;
  padding-left: 24px;
`;

export default class GameMetaHeader extends React.Component {
  state = {
    game: null,
  };

  constructor(props) {
    super(props);
    this._update(null);
  }

  componentDidUpdate(prevProps) {
    this._update(prevProps);
  }

  _update = async (prevProps) => {
    const { channel } = this.props;
    if (channel.type === 'game' && channel.gameId) {
      let prevGameId = prevProps ? prevProps.channel.gameId : null;
      if (!this.state.game || channel.gameId !== prevGameId) {
        if (this.state.game) {
          await this.setState({ game: null });
        }
        try {
          let game = await Actions.getGameByGameId(channel.gameId);
          this.setState({ game });
        } catch (_) {}
      }
    }
  };

  _renderLinks = () => {
    let linkElements = [];
    linkElements.push(
      <div key="websiteUrl" className={STYLES_LINK_ITEM} onClick={() => {}}>
        <span>todo: links</span>
      </div>
    );

    if (linkElements.length) {
      return <div className={STYLES_LINKS_ROW}>{linkElements}</div>;
    }
    return null;
  };

  _getNavigationItems = () => {
    return [{ label: 'Activity', key: 'activity' }];
  };

  render() {
    const { game } = this.state;
    if (!game) return null;

    let aboutElement = <div className={STYLES_ABOUT}>todo: about</div>;
    const linksElement = this._renderLinks();

    // TODO: game cover image and title
    const name = game.title;
    const coverImage = game.coverImage ? game.coverImage.url : null;
    return (
      <div className={STYLES_CONTAINER} onClick={this.props.onClick}>
        <div className={STYLES_BODY}>
          <div className={STYLES_BODY_LEFT}>
            <div className={STYLES_TOP}>
              <div
                className={STYLES_COVER}
                style={{ backgroundImage: coverImage ? `url('${coverImage}')` : null }}
              />
              <div className={STYLES_CREATOR_IDENTITY}>
                <UIHeading style={{ marginBottom: 8 }}>{name}</UIHeading>
                <div className={STYLES_META}>todo: status</div>
              </div>
            </div>
            {linksElement}
          </div>
        </div>
        <UIHorizontalNavigation
          items={this._getNavigationItems()}
          selectedKey="activity"
          style={{ borderBottom: `1px solid #ececec` }}
        />
      </div>
    );
  }
}
