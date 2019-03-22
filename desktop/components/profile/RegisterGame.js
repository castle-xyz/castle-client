import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import { Value } from 'slate';
import { css } from 'react-emotion';

import UIGameGrid from '~/components/reusable/UIGameGrid';
import UIInputSecondary from '~/components/reusable/UIInputSecondary';
import UITextArea from '~/components/reusable/UITextArea';
import UISubmitButton from '~/components/reusable/UISubmitButton';

import ContentEditor from '~/editor/ContentEditor';
import DefaultState from '~/editor/default.json';

const STYLES_CONTAINER = css`
  display: flex;
  flex-wrap: wrap;
`;

const STYLES_SECTION = css`
  padding: 24px 24px 24px 24px;
  width: 40%;
  min-width: 300px;
  max-width: 480px;
`;

const STYLES_FORM_ACTIONS = css`
  display: flex;
  margin-top: 12px;
`;

const STYLES_HEADING = css`
  font-family: ${Constants.font.heading};
  font-size: ${Constants.typescale.lvl5};
  margin-bottom: 16px;
`;

const STYLES_PARAGRAPH = css`
  font-size: ${Constants.typescale.lvl6};
  line-height: ${Constants.linescale.lvl6};
  margin-bottom: 16px;
`;

const STYLES_GAME_PREVIEW_ERROR = css`
  color: ${Constants.colors.red};
  margin: 16px 0 16px 0;
`;

const STYLES_GAME_PREVIEW_ERROR_DETAIL = css`
  font-size: ${Constants.typescale.lvl6};
  margin-bottom: 16px;
  padding-left: 16px;
  border-left: 3px solid ${Constants.colors.background4};
`;

const STYLES_GAME_PREVIEW_URL = css`
  text-decoration: underline;
  cursor: default;
`;

const STYLES_LINK = css`
  color: ${Constants.colors.action};
  text-decoration: underline;
  cursor: pointer;
`;

export default class RegisterGame extends React.Component {
  state = {
    urlInputValue: '',
    previewedGame: {
      slug: null,
    },
    previewError: null,
    isLoadingPreview: false,
  };
  _debouncePreviewTimeout = null;

  componentWillReceiveProps(nextProps) {
    this._resetForm();
  }

  _resetForm = () => {
    this.setState({
      urlInputValue: '',
      previewedGame: {
        slug: null,
      },
      previewError: null,
      isLoadingPreview: false,
    });
  };

  _updateGamePreview = async () => {
    this._debouncePreviewTimeout = null;
    let previewedGame = {};
    let previewError = null;
    if (this.state.urlInputValue && this.state.urlInputValue.length) {
      await this.setState({ isLoadingPreview: true });
      try {
        previewedGame = await Actions.previewGameAtUrl(this.state.urlInputValue);
      } catch (e) {
        previewedGame = {};
        previewError = e.message;
      }
    }
    this.setState({ previewedGame, previewError, isLoadingPreview: false });
  };

  _handleChangeUrl = (e) => {
    this.setState({ urlInputValue: e.target.value }, () => {
      if (this._debouncePreviewTimeout) {
        clearTimeout(this._debouncePreviewTimeout);
      }
      this._debouncePreviewTimeout = setTimeout(this._updateGamePreview, 300);
    });
  };

  _isFormSubmittable = () => {
    return (
      this.state.previewedGame &&
      this.state.previewedGame.slug &&
      this.state.previewedGame.slug.length > 0
    );
  };

  _handleSubmitForm = async () => {
    let addedGame, previewError;
    if (this.state.urlInputValue && this.state.urlInputValue.length) {
      try {
        addedGame = await Actions.registerGameAtUrl(this.state.urlInputValue);
      } catch (e) {
        addedGame = {};
        previewError = e.message;
      }
    }

    if (previewError) {
      this.setState({ previewError });
    } else {
      if (this.props.onAfterSave) {
        this.props.onAfterSave();
      }
    }
  };

  _handleClickHelp = () => {
    NativeUtil.openExternalURL(`${Constants.WEB_HOST}/posts/@castle/adding-game-to-castle-profile`);
  };

  _renderGamePreview = () => {
    if (this.state.previewedGame && this.state.previewedGame.slug) {
      return (
        <div>
          <div className={STYLES_HEADING}>Game Preview</div>
          <UIGameGrid gameItems={[this.state.previewedGame]} onGameSelect={() => {}} />
          <div className={STYLES_PARAGRAPH}>
            Your Castle url will be{' '}
            <span className={STYLES_GAME_PREVIEW_URL}>
              {Constants.WEB_HOST}/{this.state.previewedGame.slug}
            </span>
          </div>
        </div>
      );
    } else if (this.state.previewError) {
      return (
        <div>
          <div className={STYLES_HEADING}>Game Preview Failed</div>
          <div className={STYLES_GAME_PREVIEW_ERROR}>
            There was a problem previewing the game at that url.
          </div>
          <div className={STYLES_GAME_PREVIEW_ERROR_DETAIL}>{this.state.previewError}</div>
        </div>
      );
    } else if (this.state.isLoadingPreview) {
      return <div className={STYLES_HEADING}>Loading Game Preview...</div>;
    } else {
      return (
        <div>
          <div className={STYLES_HEADING}>Need Help?</div>
          <div className={STYLES_PARAGRAPH}>
            <span className={STYLES_LINK} onClick={this._handleClickHelp}>
              Read our guide
            </span>{' '}
            on adding games to your profile.
          </div>
        </div>
      );
    }
  };

  render() {
    const isSubmitEnabled = this._isFormSubmittable();
    const formAction = 'Add';
    const gamePreviewElement = this._renderGamePreview();
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_SECTION}>
          <div className={STYLES_HEADING}>Add a game to your Castle profile</div>
          <div className={STYLES_PARAGRAPH}>
            Enter the url of a .castle file you made, and we'll check for a game project at that
            url.
          </div>
          <UIInputSecondary
            value={this.state.urlInputValue}
            name="urlInputValue"
            label="URL to a .castle file"
            onChange={this._handleChangeUrl}
            style={{ marginBottom: 8 }}
          />
          <div className={STYLES_FORM_ACTIONS}>
            <UISubmitButton disabled={!isSubmitEnabled} onClick={this._handleSubmitForm}>
              {formAction}
            </UISubmitButton>
          </div>
        </div>
        <div className={STYLES_SECTION}>{gamePreviewElement}</div>
      </div>
    );
  }
}
