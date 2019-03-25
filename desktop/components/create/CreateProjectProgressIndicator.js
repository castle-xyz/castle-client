import * as React from 'react';
import * as Urls from '~/common/urls';
import * as NativeUtil from '~/native/nativeutil';
import * as Project from '~/common/project';
import * as Strings from '~/common/strings';

import { CurrentUserContext } from '~/contexts/CurrentUserContext';

import Downloads from '~/native/downloads';

class CreateProjectProgressIndicator extends React.Component {
  static defaultProps = {
    fromTemplate: null,
    toDirectory: null,
    projectName: 'my-new-project',
    projectOwner: null,
    onFinished: (createdProjectUrl) => {},
  };

  state = {
    status: 'pending', // pending | downloading | ...
    download: null,
  };

  _downloadProgressInterval = null;
  _url = null;

  componentDidMount() {
    if (this.props.fromTemplate) {
      this._url = Urls.githubUserContentToArchiveUrl(this.props.fromTemplate.entryPoint);
      Downloads.start(this._url);
      this._downloadProgressInterval = setInterval(this._pollDownload, 50);
    }
  }

  componentWillUnmount() {
    if (this._downloadProgressInterval) {
      clearInterval(this._downloadProgressInterval);
    }
  }

  _pollDownload = () => {
    const download = Downloads.getInfo(this._url);
    let status = 'pending';
    if (download && download.status !== 'pending') {
      if (download.status === 'finished') {
        status = 'extracting';
        clearInterval(this._downloadProgressInterval);
        this._downloadProgressInterval = null;
        this._extractDownloadedProject(download.path);
      } else {
        status = 'downloading';
      }
    }
    this.setState({
      status,
      download,
    });
  };

  _extractDownloadedProject = async (path) => {
    let success = false;
    let status;
    if (this.props.toDirectory) {
      success = await NativeUtil.unzipAsync(path, this.props.toDirectory);
    }
    if (success) {
      status = 'configuring';
      this._configureNewProject(this.props.toDirectory);
    } else {
      // TODO: real error
      status = 'error';
    }
    this.setState({
      status,
    });
  };

  _configureNewProject = async (path) => {
    let success = false;
    let projectFilename = `${Strings.toDirectoryName(this.props.projectName)}.castle`;
    try {
      await Project.rewriteCastleFileAsync({
        containingFolder: path,
        newFilename: projectFilename,
        newOwner: this.props.projectOwner ? this.props.projectOwner.username : null,
        newTitle: this.props.projectName ? this.props.projectName : 'my-new-project',
      });
    } catch (_) {
      // TODO: show error
    }
    this.setState(
      {
        status: 'finished',
      },
      () => {
        // TODO: windows
        const createdProjectUrl = `file://${path}/${projectFilename}`;
        this.props.onFinished(createdProjectUrl);
      }
    );
  };

  render() {
    let statusText;
    switch (this.state.status) {
      case 'pending':
        statusText = 'Downloading project template files...';
        break;
      case 'downloading':
        let percent = this.state.download.progress * 100;
        statusText = `Downloading project template files... (${percent}%)`;
        break;
      case 'extracting':
        statusText = 'Extracting project files...';
        break;
      case 'configuring':
        statusText = 'Configuring project...';
        break;
      case 'finished':
        statusText = 'Finished';
        break;
      case 'error':
        statusText = 'Error';
        break;
    }
    return <div>{statusText}</div>;
  }
}

export default class CreateProjectProgressIndicatorWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => (
          <CreateProjectProgressIndicator projectOwner={currentUser.user} {...this.props} />
        )}
      </CurrentUserContext.Consumer>
    );
  }
}
