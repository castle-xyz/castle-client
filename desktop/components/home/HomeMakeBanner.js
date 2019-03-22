import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import Logs from '~/common/logs';
import * as NativeUtil from '~/native/nativeutil';
import UIButton from '~/components/reusable/UIButton';
import UIHeading from '~/components/reusable/UIHeading';

const STYLES_CONTAINER = css`
  background: #c1bcbb;
`;

const STYLES_ACTIONS = css`
  display: flex;
  flex-wrap: nowrap;
`;

const STYLES_ACTION = css`
  border-right: 1px solid #c1bcbb;
  background-color: #ffffff;
  flex-shrink: 0;
  padding: 16px 32px 16px 24px;
  cursor: pointer;
  transition: 200ms ease all;
  font-family: ${Constants.font.system};
  color: ${Constants.colors.black};

  :hover {
    color: magenta;
    background-color: #f2f2f2;
  }
`;

const STYLES_ACTION_HEADING = css`
  font-family: ${Constants.font.heading};
  font-size: 16px;
`;

const STYLES_ACTION_PARAGRAPH = css`
  line-height: 18px;
  font-size: 14px;
  margin-top: 4px;
`;

export default class HomeMakeBanner extends React.Component {
  static defaultProps = {
    navigateToGameUrl: async (url) => {},
  };

  _handleClickExamples = () => {
    NativeUtil.openExternalURL(`${Constants.WEB_HOST}/examples`);
  };

  _handleClickDiscord = () => {
    NativeUtil.openExternalURL('https://discordapp.com/invite/4C7yEEC');
  };

  _handleClickTutorial = () => {
    NativeUtil.openExternalURL(`${Constants.WEB_HOST}/documentation`);
  };

  _handleCreateProject = async () => {
    const newProjectDirectory = await NativeUtil.chooseDirectoryWithDialogAsync({
      title: 'Create a New Castle Project',
      message: 'Choose a folder where the project will be created.',
      action: 'Create Project',
    });
    if (newProjectDirectory) {
      let entryPointFilePath;
      try {
        entryPointFilePath = await NativeUtil.createProjectAtPathAsync(newProjectDirectory);
      } catch (_) {}
      if (entryPointFilePath) {
        const gameUrl = `file://${entryPointFilePath}`;
        await this.props.navigateToGameUrl(gameUrl);
        Logs.system('Welcome to Castle!');
        Logs.system(`We created your project at ${gameUrl}.`);
        Logs.system(`Open that file in your favorite text editor to get started.`);
        Logs.system(`Need help? Check out ${Constants.WEB_HOST}/documentation`);
      }
    }
  };
  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_ACTIONS}>
          <div className={STYLES_ACTION} onClick={this._handleCreateProject}>
            <div className={STYLES_ACTION_HEADING}>Start new project</div>
            <div className={STYLES_ACTION_PARAGRAPH} style={{ color: Constants.colors.black }}>
              Create from nothing or an example.
            </div>
          </div>
          <div className={STYLES_ACTION} onClick={this._handleCreateProject}>
            <div className={STYLES_ACTION_HEADING}>Add work to profile</div>
            <div className={STYLES_ACTION_PARAGRAPH} style={{ color: Constants.colors.black }}>
              Share your work so everyone can see it!
            </div>
          </div>
          <div className={STYLES_ACTION} onClick={this._handleCreateProject}>
            <div className={STYLES_ACTION_HEADING}>Documentation!</div>
            <div className={STYLES_ACTION_PARAGRAPH} style={{ color: Constants.colors.black }}>
              Learn more about creating on Castle
            </div>
          </div>
        </div>
      </div>
    );
  }
}
