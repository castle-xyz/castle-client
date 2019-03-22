import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import CreateProjectProgressIndicator from '~/components/create/CreateProjectProgressIndicator';
import Logs from '~/common/logs';
import ProjectPathChooser from '~/components/create/ProjectPathChooser';
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

  state = {
    step: 'choose-template',
    selectedTemplate: null,
    selectedProjectParentDirectoryPath: null,
    selectedProjectDirectoryName: null,
  };

  componentDidMount() {
    this._setDefaultProjectDirectory();
  }

  _setDefaultProjectDirectory = async () => {
    const directory = await NativeUtil.getDocumentsPathAsync();
    this.setState({
      selectedProjectParentDirectoryPath: directory,
      selectedProjectDirectoryName: 'my-castle-project',
    });
  };

  _handleBackToTemplate = () => {
    this.setState({
      step: 'choose-template',
      selectedTemplate: null,
    });
  };

  _handleSelectTemplate = (game) => {
    this.setState({
      step: 'configure-project',
      selectedTemplate: game,
    });
  };

  _handleSelectDirectory = (directory) => {
    this.setState({
      selectedProjectParentDirectoryPath: directory,
    });
  };

  _handleCreateProject = () => {
    this.setState({
      step: 'create-project',
    });
  };

  _handleNavigateToProject = async () => {
    if (this.state.selectedProjectParentDirectoryPath) {
      let entryPointFilePath;
      try {
        entryPointFilePath = await NativeUtil.createProjectAtPathAsync(this._getFinalProjectPath());
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

  _renderChooseTemplate = () => {
    return (
      <React.Fragment>
        <UIHeading>Choose a starter project</UIHeading>
        <div className={STYLES_PARAGRAPH}>
          Castle will download some starter files for your new game. Choose the starter project that
          best fits.
        </div>
        <ProjectTemplateChooser
          templates={this.props.templates}
          selectedTemplate={this.state.selectedTemplate}
          onSelectTemplate={this._handleSelectTemplate}
        />
        <div className={STYLES_ACTIONS}>
          <div className={STYLES_BACK} onClick={this.props.navigateToHome}>
            Cancel
          </div>
        </div>
      </React.Fragment>
    );
  };

  _renderConfigureProject = () => {
    let projectParentDirectoryPath = this.state.selectedProjectParentDirectoryPath;
    let projectDirectoryName = this.state.selectedProjectDirectoryName;
    return (
      <React.Fragment>
        <UIHeading>Choose your project folder</UIHeading>
        <ProjectPathChooser
          selectedParentDirectoryPath={projectParentDirectoryPath}
          selectedDirectoryName={projectDirectoryName}
          onSelectDirectory={this._handleSelectDirectory}
        />
        <div className={STYLES_ACTIONS}>
          <div className={STYLES_BACK} onClick={this._handleBackToTemplate}>
            Back
          </div>
          <UIButton onClick={this._handleCreateProject}>Create Project</UIButton>
        </div>
      </React.Fragment>
    );
  };

  _getFinalProjectPath = () => {
    // TODO: windows
    return `${this.state.selectedProjectParentDirectoryPath}/${
      this.state.selectedProjectDirectoryName
    }`;
  };

  _renderCreatingProject = () => {
    return (
      <React.Fragment>
        <UIHeading>Creating your project...</UIHeading>
        <CreateProjectProgressIndicator
          fromTemplate={this.state.selectedTemplate}
          toDirectory={this._getFinalProjectPath()}
        />
      </React.Fragment>
    );
  };

  render() {
    let content;
    if (this.state.step === 'choose-template') {
      content = this._renderChooseTemplate();
    } else if (this.state.step === 'configure-project') {
      content = this._renderConfigureProject();
    } else if (this.state.step === 'create-project') {
      content = this._renderCreatingProject();
    }
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENT}>{content}</div>
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
