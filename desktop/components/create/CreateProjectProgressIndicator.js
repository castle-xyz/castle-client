import * as React from 'react';
import * as Urls from '~/common/urls';

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
    const download = Downloads.get(this._url);
    let status = 'pending';
    if (download) {
      if (download.status === 'finished') {
        status = 'extracting'; // TODO
        clearInterval(this._downloadProgressInterval);
        this._downloadProgressInterval = null;
      } else {
        status = 'downloading';
      }
    }
    this.setState({
      status,
      download,
    });
  };

  render() {
    let statusText;
    switch (this.state.status) {
      case 'pending':
        statusText = 'Starting download...';
        break;
      case 'downloading':
        statusText = `Downloading... (${this.state.download.progress * 100}%)`;
        break;
      case 'extracting':
        statusText = 'Download finished';
        break;
    }
    return <div>{statusText}</div>;
  }
}
