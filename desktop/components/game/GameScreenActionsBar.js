import * as React from 'react';
import * as GameSVG from '~/components/primitives/game-screen-svg';
import * as SVG from '~/components/primitives/svg';
import * as Constants from '~/common/constants';
import { getSessionLink, getShortSessionLink } from '~/common/utilities';

import { css } from 'react-emotion';

import DevelopmentCpuMonitor from '~/components/game/DevelopmentCpuMonitor';
import MultiplayerInvite from '~/components/game/MultiplayerInvite';

const STYLES_CONTAINER = css`
  height: 48px;
  width: 100%;
  background: linear-gradient(to top, #cccccc 0%, #d6d6d6 1px, #ebebeb 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 0;
  color: #222;
  font-size: 12px;
`;

const STYLES_CHAT_FIELD = css`
  font-size: 14px;
  line-height: 14px;
  flex-shrink: 0;
  width: 188px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px 4px 16px;
  background: rgba(255, 255, 255, 0.8);
  color: #999;
`;

const STYLES_LEFT = css`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 200px;
`;

const STYLES_MIDDLE = css`
  width: 100%;
  min-width: 20%;
  text-align: center;
`;

const STYLES_RIGHT = css`
  flex-shrink: 0;
  min-width: 200px;
  text-align: right;
`;

const STYLES_CTA = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
`;

const CTA = (props) => {
  return (
    <span
      className={STYLES_CTA}
      style={{ ...props.style, color: props.active ? 'magenta' : null }}
      onClick={props.onClick}>
      {props.children}
    </span>
  );
};

export default class GameScreenActionsBar extends React.Component {
  static defaultProps = {
    game: null,
    sessionId: null,
    onChangeVolumme: null,
    onPostScreenshot: null,
    onViewSource: null,
    onViewDeveloper: null,
    isRecording: false,
  };

  render() {
    let { game, sessionId } = this.props;
    let sessionLink = getSessionLink(game, sessionId);
    let shortSessionLink = getShortSessionLink(game, sessionId) || sessionLink;

    let volumeElement = <GameSVG.AudioOn height="20px" style={{ marginRight: 8 }} />;
    if (this.props.isMuted) {
      volumeElement = <GameSVG.AudioOff height="20px" style={{ marginRight: 8 }} />;
    }

    return (
      <div className={STYLES_CONTAINER} style={this.props.style}>
        <div className={STYLES_LEFT} style={{ paddingLeft: 16 }}>
          {sessionLink ? (
            <MultiplayerInvite
              style={{ marginRight: 18 }}
              sessionLink={sessionLink}
              shortSessionLink={shortSessionLink}
            />
          ) : null}
          {this.props.onToggleMute ? (
            <CTA style={{ marginRight: 24 }} onClick={this.props.onToggleMute}>
              {volumeElement}
            </CTA>
          ) : null}
        </div>
        <div className={STYLES_MIDDLE}>
          {this.props.onPostScreenshot ? (
            <CTA style={{ marginRight: 24 }} onClick={this.props.onPostScreenshot}>
              <GameSVG.Camera height="32px" style={{ marginRight: 8 }} />
            </CTA>
          ) : null}

          {this.props.onPostScreenCapture ? (
            <CTA style={{ marginRight: 24 }} onClick={this.props.onPostScreenCapture}>
              <GameSVG.VideoCamera
                height="32px"
                style={{ marginRight: 8, fill: this.props.isRecording ? '#f00' : '#000' }}
              />
            </CTA>
          ) : null}
        </div>
        <div className={STYLES_RIGHT}>
          <CTA style={{ marginRight: 24, cursor: 'default' }}>
            <GameSVG.Chip height="20px" style={{ marginRight: 8 }} />
            <DevelopmentCpuMonitor />
          </CTA>

          {this.props.onViewSource ? (
            <CTA style={{ marginRight: 24 }} onClick={this.props.onViewSource}>
              <GameSVG.Source height="20px" style={{ marginRight: 8 }} />
            </CTA>
          ) : null}

          {this.props.onViewDeveloper ? (
            <CTA onClick={this.props.onViewDeveloper} active={this.props.developer}>
              <GameSVG.Tools height="20px" style={{ marginRight: 8 }} />
            </CTA>
          ) : null}
        </div>
      </div>
    );
  }
}

/*
  <CTA style={{ marginRight: 24 }}>
    <GameSVG.Multiplayer height="20px" style={{ marginRight: 8 }} />
  </CTA>
*/
