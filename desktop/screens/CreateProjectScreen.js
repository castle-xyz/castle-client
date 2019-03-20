import * as React from 'react';

import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import Logs from '~/common/logs';

export default class CreateProjectScreen extends React.Component {
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
      <div>
        <div>Choose a starter project</div>
      </div>
    );
  }
}
