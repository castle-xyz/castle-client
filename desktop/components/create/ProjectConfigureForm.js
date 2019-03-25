import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import CreateProjectInput from '~/components/create/CreateProjectInput';

const STYLES_PROJECT_INPUT_CONTAINER = css`
  border: 1px solid ${Constants.colors.background4};
  border-radius: 4px;
  margin-bottom: 16px;
  background-color: ${Constants.colors.background};
`;

const STYLES_PROJECT_PATH_CHOOSER = css`
  display: flex;
  border-top: 1px solid ${Constants.colors.background4};
`;

const STYLES_PROJECT_PATH_PREVIEW = css`
  cursor: default;
  width: 100%;
  padding: 8px;
  font-size: ${Constants.typescale.lvl7};
  line-height: ${Constants.linescale.lvl5};
`;

const STYLES_PARAGRAPH = css`
  color: ${Constants.colors.black};
  font-size: ${Constants.typescale.base};
  line-height: ${Constants.linescale.base};
  margin-top: 16px;
  margin-bottom: 12px;
`;

const STYLES_PROJECT_DIRECTORY = css`
  font-weight: 700;
  color: ${Constants.colors.text};
`;

const STYLES_PROJECT_FILENAME = css`
  color: #8e8e8e;
`;

const STYLES_ACTION = css`
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid ${Constants.colors.background4};
  padding: 8px;
  flex-shrink: 0;
  font-size: ${Constants.typescale.lvl7};
  line-height: ${Constants.linescale.lvl5};
  color: ${Constants.colors.action};
  font-family: ${Constants.font.mono};
  text-decoration: underline;
  text-transform: uppercase;
  word-spacing: -0.2rem;
  cursor: pointer;
`;

export default class ProjectConfigureForm extends React.Component {
  static defaultProps = {
    selectedParentDirectoryPath: '',
    selectedProjectName: '',
    selectedDirectoryName: '',
    onSelectDirectory: (directory) => {},
    onChangeProjectName: (e) => {},
  };

  _handleChangeDirectory = async () => {
    const newProjectDirectory = await NativeUtil.chooseDirectoryWithDialogAsync({
      title: 'Create a New Castle Project',
      message: 'Choose a folder where the project will be created.',
      action: 'Select Folder',
    });
    this.props.onSelectDirectory(newProjectDirectory);
  };

  render() {
    let projectParentDirectoryPath = this.props.selectedParentDirectoryPath;
    let projectDirectoryName = this.props.selectedDirectoryName;
    let projectFileName = `${projectDirectoryName}.castle`;
    return (
      <div className={STYLES_PROJECT_INPUT_CONTAINER}>
        <CreateProjectInput
          name="projectName"
          value={this.props.selectedProjectName}
          label="Project Name"
          placeholder="Please enter a name for your new project"
          onChange={this.props.onChangeProjectName}
        />
        <div className={STYLES_PROJECT_PATH_CHOOSER}>
          <div className={STYLES_PROJECT_PATH_PREVIEW}>
            <span className={STYLES_PROJECT_DIRECTORY}>{projectParentDirectoryPath}</span>
            <span className={STYLES_PROJECT_FILENAME}>
              /{projectDirectoryName}/{projectFileName}
            </span>
          </div>
          <div className={STYLES_ACTION} onClick={this._handleChangeDirectory}>
            Change Folder
          </div>
        </div>
      </div>
    );
  }
}
