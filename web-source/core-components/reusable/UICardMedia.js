import * as React from 'react';
import * as Constants from '~/common/constants';
import * as CEF from '~/common/cef';
import * as SVG from '~/core-components/primitives/svg';
import * as Strings from '~/common/strings';
import * as Urls from '~/common/urls';

import { css } from 'react-emotion';

import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';
import UIInputSecondary from '~/core-components/reusable/UIInputSecondary';
import UILink from '~/core-components/reusable/UILink';
import UIControl from '~/core-components/reusable/UIControl';

import ContentEditor from '~/editor/ContentEditor';

const STYLES_FORM = css`
  margin: 48px 0 48px 0;
`;

const STYLES_CONTAINER = css`
  padding: 16px;
  background: ${Constants.brand.background};
  color: ${Constants.colors.white};
`;

const STYLES_CONTAINER_PREVIEW_LABEL = css`
  font-size: 10px;
  margin-bottom: 16px;
  font-weight: 600;
`;

const STYLES_CONTAINER_PREVIEW_NAME = css`
  overflow-wrap: break-word;
  width: 100%;
  font-size: 48px;
  line-height: 52px;
  font-weight: 400;
  margin-top: 40px;
`;

const STYLES_BYLINE = css`
  margin-top: 8px;
  font-size: 10px;
  margin-bottom: 24px;
`;

const STYLES_SECTION = css`
  margin-top: 24px;
  width: 100%;
  overflow-wrap: break-word;
`;

const STYLES_SECTION_TITLE = css`
  font-size: 16px;
  letter-spacing: 0.2px;
  margin-bottom: 16px;
  font-weight: 600;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  width: 100%;
`;

const STYLES_SECTION_PARAGRAPH = css`
  line-height: 1.725;
  font-weight: 200;
  font-size: 16px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 16px;
`;

export default class UICardMedia extends React.Component {
  _handleShare = media => {
    let name = media.name ? media.name : 'untitled';
    let url;
    if (media.slug && media.username) {
      // registered media
      url = `https://www.playcastle.io/@${media.username}/${media.slug}`;
    } else {
      let author = 'anonymous';
      if (media.user && media.user.username) {
        // TODO: deprecated: unregistered media shouldn't have a `user` object.
        author = media.user.username;
      } else if (media.username) {
        author = media.username;
      }
      url = `https://www.playcastle.io/games?name=${name}&author=${author}&url=${media.mediaUrl}`;
    }

    if (window.cefQuery) {
      CEF.openExternalURL(window.encodeURI(url));
      return;
    }

    window.open(url);
  };

  _handleViewSource = () => {
    CEF.openExternalURL(Urls.githubUserContentToRepoUrl(this.props.media.mediaUrl));
  };
  
  render() {
    let name = 'Untitled';
    let username = 'Anonymous';
    let createdTime = '';
    let isRegistered = false;
    let description = '';
    let legacyRichDescription;
    
    let { media } = this.props;
    if (media) {
      name = (media.name) ? media.name : name;
      isRegistered = (media.slug && media.user);
      if (media.published) {
        createdTime = Strings.toDate(media.published);
      } else if (media.createdTime) {
        createdTime = Strings.toDate(media.createdTime);
      }
      if (isRegistered) {
        username = media.user.username;
      } else {
        username = media.username ? media.username : username;
        if (media.user && media.user.username) {
          // TODO: deprecated: unregistered media shouldn't have a `user`,
          // so we can just delete this case once that's true.
          username = media.user.username;
        }
      }
      if (media.description && media.description.hasOwnProperty('rich')) {
        // TODO: media should only be able to provide its description from
        // its .castle file, so we can remove deprecated behavior here after
        // the data reflects this.
        legacyRichDescription = Strings.loadEditor(media.description.rich);
      } else {
        description = (media.description) ? media.description : description;
      }
    }

    let textElement = <div />;

    if (legacyRichDescription) {
      textElement = (
        <div>
          <ContentEditor value={legacyRichDescription} className={STYLES_SECTION_PARAGRAPH} readOnly />
        </div>
      );
    } else if (description) {
      textElement = (
        <div className={STYLES_SECTION_PARAGRAPH}>{description}</div>
      );
    } else {
      textElement = (
        <div>
          <div className={STYLES_SECTION_TITLE} style={{ marginTop: 32 }}>
            Is this your game?
          </div>
          <div className={STYLES_SECTION_PARAGRAPH}>
            Castle can open any publicly visible url to a compatible game. If you created this game
            and want to claim it, change the way it's presented, or remove it, please contact the
            Castle team and let us know.
          </div>
        </div>
      );
    }

    let creatorElement;
    if (isRegistered) {
      creatorElement = (
        <UILink onClick={() => this.props.onUserSelect(this.props.media.user)}>{username}</UILink>
      );
    } else {
      creatorElement = (<span>{username}</span>);
    }

    let maybeViewSourceElement;
    if (Urls.isOpenSource(this.props.media.mediaUrl)) {
      maybeViewSourceElement = (
        <div>
          <UIButtonIconHorizontal icon={<SVG.Share height="16px" />}
           onClick={this._handleViewSource}>
            View Source
          </UIButtonIconHorizontal>
        </div>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTAINER_PREVIEW_NAME}>{name}</div>
        <div className={STYLES_BYLINE}>
          Created by{' '}
          {creatorElement}{' '}
          {(createdTime) ? `- ${createdTime}` : ''}
        </div>

        <div className={STYLES_SECTION}>
          {textElement}
          <div style={{ marginTop: 32 }}>
            <div>
              <UIButtonIconHorizontal icon={<SVG.Share height="16px" />}
                                      onClick={() => this._handleShare(this.props.media)}>
                Share it
              </UIButtonIconHorizontal>
            </div>
            {maybeViewSourceElement}
          </div>
        </div>
      </div>
    );
  }
}
