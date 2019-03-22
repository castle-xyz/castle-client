import * as React from 'react';
import * as Urls from '~/common/urls';
import * as NativeUtil from '~/native/nativeutil';

import Downloads from '~/native/downloads';

export default class CreateProjectProgressIndicator extends React.Component {
  static defaultProps = {
    fromTemplate: null,
    toDirectory: null,
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
    if (this.props.toDirectory) {
      success = await NativeUtil.unzipAsync(path, this.props.toDirectory);
    }
    if (success) {
      this.setState({
        status: 'finished',
      });
    } else {
      // TODO: real error
      this.setState({
        status: 'error',
      });
    }
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
