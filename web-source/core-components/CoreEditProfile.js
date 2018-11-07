import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIControl from '~/core-components/reusable/UIControl';

export default class CoreEditProfile extends React.Component {
  state = {
    avatarFile: null,
  };
  
  _onAvatarFileInputChange = (e) => {
    let files = e.target.files;
    if (files && files.length) {
      this.setState({ avatarFile: files[0] });
    }
  };

  _onUploadFileAsync = async () => {
    console.log('uploading image...');
    if (this.state.avatarFile) {
      console.log(`file to upload: ${this.state.avatarFile.name}`);
      const result = await Actions.uploadImageAsync({
        file: this.state.avatarFile
      });
      console.log(`upload image result: ${JSON.stringify(result, null, 2)}`);
    }
  }

  render() {
    return (
      <div>
        <p>Edit profile:</p>
        <input
          type="file"
          id="avatar"
          name="avatar"
          onChange={this._onAvatarFileInputChange}
        />
        <UIControl onClick={this._onUploadFileAsync}>Upload Image</UIControl>
      </div>
    );
  }
}
