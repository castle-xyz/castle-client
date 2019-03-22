import { NativeBinds } from '~/native/nativebinds';

class Downloads {
  _downloads = null;
  _urlToDownloadId = null;

  constructor() {
    this._downloads = {};
    this._urlToDownloadId = {};
    window.addEventListener('nativeFileDownload', this._handleFileDownloadEvent);
  }

  _handleFileDownloadEvent = (e) => {
    const { params } = e;
    switch (params.status) {
      case 'start': {
        const { id, url } = params;
        this._urlToDownloadId[url] = id;
        this._downloads[id] = {
          status: 'running',
          progress: 0,
        };
        break;
      }
      case 'progress': {
        const { id, progress } = params;
        let progressNumber;
        try {
          progressNumber = parseInt(progress) / 100.0;
        } catch (e) {
          progressNumber = 0;
        }
        this._downloads[id] = {
          status: 'running',
          progress: progressNumber,
        };
        break;
      }
      case 'finish': {
        const { id, path } = params;
        this._downloads[id] = {
          status: 'finished',
          progress: 1,
          path,
        };
        break;
      }
    }
  };

  start = async (url) => {
    try {
      // TODO: cancel any existing download with this url.
      this._urlToDownloadId[url] = 0;
      await NativeBinds.downloadFile({ url });
    } catch (e) {
      delete this._urlToDownloadId[url];
      console.log(`error downloading file: ${e}`);
    }
  };

  isPending = (url) => {
    return this._urlToDownloadId[url] && this._urlToDownloadId[url] === 0;
  };

  getInfo = (url) => {
    const downloadId = this._urlToDownloadId[url];
    if (downloadId === 0) {
      return {
        status: 'pending',
      };
    } else {
      return this._downloads[downloadId];
    }
  };
}

export default new Downloads();
