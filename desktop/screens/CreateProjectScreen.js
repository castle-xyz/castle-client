import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import Logs from '~/common/logs';
import ProjectTemplateChooser from '~/components/create/ProjectTemplateChooser';
import UIButton from '~/components/reusable/UIButton';
import UIHeading from '~/components/reusable/UIHeading';

import { NavigatorContext } from '~/contexts/NavigationContext';

const STYLES_CONTAINER = css`
  background: ${Constants.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_CONTENT = css`
  max-width: 650px;
`;

const STYLES_PARAGRAPH = css`
  color: ${Constants.colors.black};
  font-size: ${Constants.typescale.base};
  line-height: ${Constants.linescale.base};
  margin-top: 16px;
  margin-bottom: 12px;
`;

const STYLES_ACTIONS = css`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const STYLES_BACK = css`
  display: inline-flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  text-decoration: underline;
  font-size: ${Constants.typescale.lvl6};
  color: ${Constants.colors.text};
  cursor: pointer;
`;

class CreateProjectScreen extends React.Component {
  static defaultProps = {
    templates: [],
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
        <div className={STYLES_CONTENT}>
          <UIHeading>Choose a starter project</UIHeading>
          <div className={STYLES_PARAGRAPH}>
            Castle will download some starter files for your new game. Choose the starter project
            that best fits.
          </div>
          <ProjectTemplateChooser templates={this.props.templates} />
          <div className={STYLES_ACTIONS}>
            <div className={STYLES_BACK} onClick={this.props.navigateToHome}>
              Cancel
            </div>
            <UIButton>Next</UIButton>
          </div>
        </div>
      </div>
    );
  }
}

export default class CreateProjectScreenWithContext extends React.Component {
  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <CreateProjectScreen
            navigateToHome={navigator.navigateToHome}
            navigateToGameUrl={navigator.navigateToGameUrl}
            {...this.props}
          />
        )}
      </NavigatorContext.Consumer>
    );
  }
}
