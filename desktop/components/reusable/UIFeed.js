import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';
import * as Strings from '~/common/strings';
import * as Urls from '~/common/urls';
import * as NativeUtil from '~/native/nativeutil';

import { css } from 'react-emotion';

import UIAvatar from '~/components/reusable/UIAvatar';
import UICharacterCard from '~/components/reusable/UICharacterCard';
import UIBoundary from '~/components/reusable/UIBoundary';
import UINavigationLink from '~/components/reusable/UINavigationLink';
import UIPlayTextCTA from '~/components/reusable/UIPlayTextCTA';

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;
  min-height: 25%;
  padding: 8px 0 0 0;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

//  box-shadow: inset 0 0 0 1px red;
const STYLES_POST = css`
  display: flex;
  width: 500px;
  padding: 24px 24px 24px 24px;
  position: relative;
`;

const STYLES_POST_ITEM = css`
  background: ${Constants.colors.white};
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  position: relative;
`;

const STYLES_POST_SCREENSHOT = css`
  width: 188px;
  height: 106px;
  flex-shrink: 0;
  transition: 200ms ease all;
  cursor: pointer;
  background-size: cover;
  background-position: 50% 50%;
  background-color: rgba(0, 0, 0, 0.1);
`;

const STYLES_TITLE = css`
  text-align: right;
  margin-top: 8px;
  font-family: ${Constants.font.game};
  font-size: 18px;
  width: 188px;
  height: 56px;
`;

const STYLES_AVATAR = css`
  background-size: cover;
  background-position: 50% 50%;
  height: 24px;
  width: 24px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
`;

const STYLES_AVATAR_CREATOR = css`
  font-family: ${Constants.font.system};
  font-weight: 700;
  color: ${Constants.colors.black};
`;

const STYLES_BYLINE = css`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
`;

const STYLES_URL = css`
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: ${Constants.font.system};
  overflow-wrap: break-word;
  max-width: 204px;
  width: 100%;
`;

const STYLES_TAG = css`
  position: absolute;
  top: 4px;
  left: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${Constants.colors.text};
  border-radius: 4px;
  padding: 0 8px 0 8px;
  height: 24px;
  font-family: ${Constants.font.monobold};
  color: white;
  font-size: 10px;
`;

const STYLES_POST_POPOVER = css`
  position: absolute;
  top: 8px;
  left: 8px;
  width: 256px;
  z-index: 4;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-24px) translateX(-24px);
  transition: 200ms ease all;
  transition-property: transform, opacity;
`;

const STYLES_POPOVER = css`
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
`;

const STYLES_POPOVER_INFO = css`
  display: flex;
  margin-top: 16px;
  align-items: flex-start;
  justify-content: space-between;
  overflow-wrap: break-word;
`;

const STYLES_POPOVER_TITLE = css`
  font-family: ${Constants.font.game};
  font-size: 18px;
  cursor: pointer;
`;

const STYLES_POPOVER_P = css`
  text-align: left;
  padding: 0 0 0 16px;
  font-family: ${Constants.font.system};
  font-size: 14px;
  width: 100%;
  min-width: 25%;
  line-height: 18px;
`;

const STYLES_POPOVER_GAME_URL = css`
  font-family: ${Constants.font.mono};
  font-size: 10px;
  margin-top: 4px;
  width: 100%;
  overflow-wrap: break-word;
`;

const STYLES_POPOVER_ACTIONS = css`
  display: flex;
  margin-top: 16px;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_POPOVER_ACTIONS_LEFT = css`
  flex-shrink: 0;
`;

const STYLES_POPOVER_ACTIONS_RIGHT = css`
  min-width: 25%;
  width: 100%;
  padding-left: 24px;
  display: inline-flex;
  justify-content: flex-end;
`;

const Tag = (props) => {
  return <span className={STYLES_TAG}>{props.children}</span>;
};

class UIPost extends React.Component {
  state = {
    visible: false,
  };

  render() {
    let { post } = this.props;
    let owner = post.owner ? post.owner : 'Unknown Owner';
    let text = post.text ? post.text : 'Unknown Text';
    let timestamp = post.timestamp ? post.timestamp : 'Unknown Timestamp';
    let mediaUrl = post.media ? post.media : null;

    return (
      <div className={STYLES_POST}>
        <div className={STYLES_POST_ITEM} style={{ background: post.primaryColor, color: "#000000" }}>
          {owner}
          {timestamp}
          {text}
          <div
            className={STYLES_POST_SCREENSHOT}
            style={{ backgroundImage: mediaUrl ? `url(${mediaUrl})` : null }}
          />
          LikeReply
        </div>
      </div>
    );
  }
}

export default class UIFeed extends React.Component {
  render() {
    // TODO: real data from props (see UIGameGrid for how it pulls games)
    return (
      <div className={STYLES_CONTAINER}>
        {this.props.postItems.map((m) => {
          const key = m.key ? m.key : m.postId;
          return (
            <UIPost
              key={key}
              post={m}
              viewer={this.props.viewer}
            />
          );
        })}
      </div>
    );
  }
}
