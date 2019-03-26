import * as React from 'react';
import { css } from 'react-emotion';

import * as Urls from '~/common/urls';
import * as NativeUtil from '~/native/nativeutil';
import * as Project from '~/common/project';
import * as Strings from '~/common/strings';

import { CurrentUserContext } from '~/contexts/CurrentUserContext';

import Downloads from '~/native/downloads';

const STYLES_CONTAINER = css`
  display: flex;
  padding: 8px;
`;

const STYLES_CANCEL = css`
  cursor: pointer;
  text-decoration: underline;
  margin-left: 16px;
`;

class CreateProjectProgressIndicator extends React.Component {
  static defaultProps = {
    fromTemplate: null,
    toDirectory: null,
    projectName: 'my-new-project',
    projectOwner: null,
    onFinished: (createdProjectUrl) => {},
    onCancel: () => {},
  };

  state = {
    status: 'pending', // pending | downloading | ...
    download: null,
    isCancelVisible: false,
  };

  _mounted = false;
  _downloadProgressInterval = null;
  _cancelVisibleTimeout = null;
  _url = null;
  _downloadId = null;

  componentDidMount() {
    this._mounted = true;
    if (this.props.fromTemplate) {
      this._url = Urls.githubUserContentToArchiveUrl(this.props.fromTemplate.entryPoint);
      Downloads.start(this._url);
      this._downloadProgressInterval = setInterval(this._pollDownload, 50);
      this._cancelVisibleTimeout = setTimeout(() => this.setState({ isCancelVisible: true }), 5000);
    }
  }

  componentWillUnmount() {
    this._stop();
    this._mounted = false;
  }

  _stop = () => {
    if (this._downloadProgressInterval) {
      clearInterval(this._downloadProgressInterval);
      this._downloadProgressInterval = null;
    }
    if (this._cancelVisibleTimeout) {
      clearTimeout(this._cancelVisibleTimeout);
      this._cancelVisibleTimeout = null;
    }
    if (this._downloadId) {
      Downloads.cancel(this._downloadId);
      this._downloadId = null;
    }
  };

  _pollDownload = () => {
    const download = Downloads.getInfo(this._url);
    let status = 'pending';
    if (download && download.status !== 'pending') {
      if (download.status === 'finished') {
        this._downloadId = null;
        status = 'extracting';
        clearInterval(this._downloadProgressInterval);
        this._downloadProgressInterval = null;
        if (this._mounted) {
          this._extractDownloadedProject(download.path);
        }
      } else {
        this._downloadId = download.id;
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
    if (this._mounted) {
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
    }
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
    if (this._mounted) {
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
    }
  };

  _handleCancel = async () => {
    this._stop();
    this.props.onCancel();
  };

  render() {
    let statusText;
    let maybeCancelElement;
    if (this.state.isCancelVisible) {
      maybeCancelElement = (
        <div className={STYLES_CANCEL} onClick={this.props.onCancel}>
          Cancel
        </div>
      );
    }
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
    return (
      <div className={STYLES_CONTAINER}>
        <div>{statusText}</div>
        {maybeCancelElement}
      </div>
    );
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
