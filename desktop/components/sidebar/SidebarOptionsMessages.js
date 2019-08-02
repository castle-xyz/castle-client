import * as React from 'react';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';
import * as ChatActions from '~/common/actions-chat';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UISidebarInput from '~/components/reusable/UISidebarInput';
import SidebarMessageItem from '~/components/sidebar/SidebarMessageItem';

const STYLES_HEADER = css`
  border-bottom: 1px solid ${Constants.REFACTOR_COLORS.elements.border};
  color: ${Constants.REFACTOR_COLORS.text};
  font-family: ${Constants.REFACTOR_FONTS.system};
  width: 100%;
  flex-shrink: 0;
  padding: 8px 8px 8px 8px;
  margin-bottom: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_HEADER_LEFT = css`
  min-width: 25%;
  width: 100%;
`;

const STYLES_HEADER_RIGHT = css`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 200ms ease color;
  padding: 8px;

  :hover {
    color: magenta;
  }
`;

const STYLES_TITLE = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  color: ${Constants.REFACTOR_COLORS.subdued};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1px;
  padding: 0 16px 0 16px;
  margin-bottom: 8px;
`;

const STYLES_FORM = css`
  padding: 0 16px 0 16px;
`;

export const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export default class SidebarOptionsMessages extends React.Component {
  static defaultProps = {
    viewer: null,
    onDismiss: () => {},
    onSendMessage: (user) => {},
    userPresence: null,
  };
  _timeout;

  state = {
    query: '',
    results: [],
  };

  componentWillUnmount() {
    window.clearTimeout(this._timeout);
    this._timeout = null;
  }

  _handleChange = (e) => {
    const value = e.target.value;
    this.setState({ [e.target.name]: value }, () => {
      window.clearTimeout(this._timeout);
      this._timeout = null;
      this._handleSearch(value);
    });
  };

  _handleSearch = (value) => {
    this._timeout = window.setTimeout(async () => {
      const { userPresence } = this.props;
      let users = null,
        channels = [];

      let autocompleteResults = await ChatActions.getAutocompleteAsync(value, ['users']);
      if (autocompleteResults.users) {
        users = autocompleteResults.users;
      }

      if (users) {
        channels = users.map((u) => {
          return {
            user: u,
            type: 'dm',
            otherUserIsOnline: userPresence && userPresence.onlineUserIds[u.userId],
            name: Strings.getName(u),
          };
        });
        channels = ChatUtilities.sortChannels(channels);
      }

      this.setState({ results: channels });
    }, 300);
  };

  render() {
    const { viewer, onDismiss, onSendMessage } = this.props;
    const channels = this.state.results;

    return (
      <React.Fragment>
        <header className={STYLES_HEADER}>
          <div className={STYLES_HEADER_LEFT} />
          <div className={STYLES_HEADER_RIGHT} onClick={onDismiss}>
            <SVG.Dismiss size="16px" />
          </div>
        </header>
        <div className={STYLES_TITLE}>Message a user</div>

        <div className={STYLES_FORM}>
          <UISidebarInput
            label="By username"
            name="query"
            onChange={this._handleChange}
            value={this.state.query}
          />
        </div>

        {channels && channels.length ? (
          <div className={STYLES_TITLE} style={{ marginTop: 40 }}>
            Users found
          </div>
        ) : null}
        {channels.map((c) => {
          if (c.user.username === viewer.username) {
            return null;
          }

          return (
            <SidebarMessageItem
              key={`channel-${c.user.userId}`}
              onClick={() => onSendMessage(c.user)}
              name={c.name}
              isUnread={false}
              notificationCount={0}
              isOnline={c.otherUserIsOnline}
              isSelected={false}
              status={null}
              avatarUrl={c.user.photo ? c.user.photo.url : null}
            />
          );
        })}
      </React.Fragment>
    );
  }
}
