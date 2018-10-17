import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/core-components/primitives/svg';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';
import UIInputSecondary from '~/core-components/reusable/UIInputSecondary';
import UILink from '~/core-components/reusable/UILink';
import ControlPlaylistAdd from '~/core-components/controls/ControlPlaylistAdd';

import ContentEditor from '~/editor/ContentEditor';

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
  state = {
    email: '',
    message: '',
  };

  _handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  _handleSubmit = async () => {
    await this.props.onRegisterMedia({ email: this.state.email, message: this.state.message });

    this.setState({ email: '', message: '' });
  };

  render() {
    const name = this.props.media && this.props.media.name ? this.props.media.name : 'Untitled';
    const username =
      this.props.media && this.props.media.user ? this.props.media.user.username : 'Anonymous';
    const createdTime =
      this.props.media && this.props.media.published
        ? Strings.toDate(this.props.media.published)
        : Strings.toDate(this.props.media.createdTime);
    const isReal = this.props.media && this.props.media.user && this.props.media.user.isReal;

    let rich =
      this.props.media && this.props.media.description && this.props.media.description.rich;
    if (rich) {
      rich = Strings.loadEditor(rich);
    }

    let textElement = (
      <div>
        <div className={STYLES_SECTION_TITLE} style={{ marginTop: 32 }}>
          A game on Castle
        </div>
        <div className={STYLES_SECTION_PARAGRAPH}>
          This user has not written anything about their game on Castle yet.
        </div>
      </div>
    );

    if (!isReal) {
      textElement = (
        <div>
          <div className={STYLES_SECTION_TITLE} style={{ marginTop: 32 }}>
            Is this your game?
          </div>
          <div className={STYLES_SECTION_PARAGRAPH}>
            Castle lists all the games from a game jam, so people can browse and play them all
            easily. If you created this game and want to claim it, change the way it is presented,
            or remove it, please contact the Castle team and let us know.
          </div>
        </div>
      );
    }

    if (rich) {
      textElement = (
        <div>
          <ContentEditor value={rich} className={STYLES_SECTION_PARAGRAPH} readOnly />
        </div>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTAINER_PREVIEW_NAME}>{name}</div>
        <div className={STYLES_BYLINE}>
          Created by{' '}
          <UILink onClick={() => this.props.onUserSelect(this.props.media.user)}>{username}</UILink>{' '}
          — {createdTime}
        </div>

        <div className={STYLES_SECTION}>
          {textElement}

          {!isReal ? (
            <div style={{ marginTop: 48 }}>
              <UIInputSecondary
                value={this.state.email}
                label="E-mail"
                name="email"
                onChange={this._handleChange}
                style={{ marginBottom: 16 }}
              />

              <UIInputSecondary
                value={this.state.message}
                label="message"
                name="message"
                onChange={this._handleChange}
                onSubmit={this._handleSubmit}
              />

              <UIButtonIconHorizontal
                onClick={this._handleSubmit}
                style={{ marginTop: 24 }}
                icon={<SVG.Mail height="16px" />}>
                Contact us
              </UIButtonIconHorizontal>
            </div>
          ) : null}

          {this.props.viewer ? (
            <div style={{ marginTop: 8 }}>
              <ControlPlaylistAdd
                onToggleProfile={this.props.onToggleProfile}
                onRefreshViewer={this.props.onRefreshViewer}
                media={this.props.media}
                viewer={this.props.viewer}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
