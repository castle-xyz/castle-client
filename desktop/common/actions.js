import CastleApiClient from 'castle-api-client';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';

export const API = CastleApiClient(Constants.API_HOST);

// fetches partial user data to support some owning object
const NESTED_GAME_OWNER = `
  owner {
    userId
    name
    username
    photo {
      url
      imgixUrl
      height
      width
    }
  }
`;

// fetches all the data needed to render a full user profile
const FULL_USER_FIELDS = `
  userId
  username
  name
  websiteUrl
  itchUsername
  twitterUsername
  createdTime
  updatedTime
  about
  lastUserStatus {
    userStatusId
    status
    isRecent
    lastPing
    game {
      gameId
      name
      url
    }
  }
  photo {
    url
    imgixUrl
    height
    width
  }
`;

const GAME_FIELDS = `
  gameId
  title
  url
  slug
  createdTime
  updatedTime
  description
  metadata
  entryPoint
  sessionId
  coverImage {
    url
    imgixUrl
    height
    width
  }
`;

const GAME_ITEMS = `
  gameItems {
    ${GAME_FIELDS}
    ${NESTED_GAME_OWNER}
  }
`;

export async function updateEmailPreference({ type, frequency }) {
  const response = await API.graphqlAsync(
    `
      mutation($type: String!, $frequency: EmailNotificationFrequency!) {
        updateEmailNotificationPreference(type: $type, frequency: $frequency) {
          email {
            type
            frequency
            description
          }
        }
      }
    `,
    { type, frequency }
  );

  return response;
}

export async function updateDesktopPreference({ type, frequency }) {
  const response = await API.graphqlAsync(
    `
      mutation($type: String!, $frequency: DesktopNotificationFrequency!) {
        updateDesktopNotificationPreference(type: $type, frequency: $frequency) {
          desktop {
            type
            type
            frequency
            description
          }
        }
      }
    `,
    { type, frequency }
  );

  return response;
}

export async function resetPassword({ userId }) {
  const response = await API.graphqlAsync(
    `
      mutation($userId: ID!) {
        sendResetPasswordEmail(userId: $userId)
      }
    `,
    { userId }
  );

  return response;
}

export async function getHeadersAsync() {
  return await API.client._getRequestHeadersAsync();
}

export async function getAccessTokenAsync() {
  let headers = await getHeadersAsync();
  if (!headers) {
    return null;
  }

  return headers['X-Auth-Token'];
}

export const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export async function getExistingUser({ who }) {
  const response = await API.graphqlAsync(
    `
      query($who: String!) {
        userForLoginInput(who: $who) {
          userId
          name
          username
          photo {
            url
            imgixUrl
            height
            width
          }
        }
      }
    `,
    { who }
  );

  // TOOD(jim): Write a global error handler.
  if (response.error) {
    return false;
  }

  if (response.errors) {
    return false;
  }

  return response.data.userForLoginInput;
}

export async function signup({ name, username, email, password }) {
  const response = await API.graphqlAsync(
    `
      mutation($name: String!, $username: String!, $email: String!, $password: String!) {
        signup(user: { name: $name, username: $username }, email: $email, password: $password) {
          ${FULL_USER_FIELDS}
          ${GAME_ITEMS}
          token
        }
      }
    `,
    {
      name,
      username,
      email,
      password,
    }
  );

  if (response.error) {
    return false;
  }

  if (response.errors) {
    return response;
  }

  await API.client.setTokenAsync(response.data.signup.token);

  return response;
}

export async function login({ userId, password }) {
  const response = await API.graphqlAsync(
    `
      mutation($userId: ID!, $password: String!) {
        login(userId: $userId, password: $password) {
          ${FULL_USER_FIELDS}
          ${GAME_ITEMS}
          token
        }
      }
    `,
    {
      userId,
      password,
    }
  );

  // TOOD(jim): Write a global error handler.
  if (response.error) {
    return false;
  }

  if (response.errors) {
    return response;
  }

  NativeUtil.sendLuaEvent('CASTLE_SET_LOGGED_IN', !!response.data.login);
  await API.client.setTokenAsync(response.data.login.token);
  return response.data.login;
}

export async function getUser({ userId }) {
  const variables = { userId };
  const result = await API(
    `
    query($userId: ID!) {
      user(userId: $userId) {
        ${FULL_USER_FIELDS}
        ${GAME_ITEMS}
      }
    }
  `,
    variables
  );

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.user;
}

export async function getUsers({ userIds }) {
  const variables = { userIds };
  const result = await API(
    `
    query($userIds: [ID]!) {
      users(userIds: $userIds) {
        ${FULL_USER_FIELDS}
        ${GAME_ITEMS}
      }
    }
  `,
    variables
  );

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.users;
}

export async function getNotificationPreferences() {
  const result = await API(`
    query {
      getNotificationPreferences {
        email {
          type
          description
          frequency
        }
        desktop {
          type
          description
          frequency
        }
      }
    }
  `);

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  let notifications;
  if (result && result.data) {
    notifications = result.data.getNotificationPreferences;
  }

  return notifications;
}

export async function getViewer() {
  const result = await API(`
    query {
      me {
        ${FULL_USER_FIELDS}
        ${GAME_ITEMS}
      }

      getNotificationPreferences {
        email {
          type
          description
          frequency
        }
        desktop {
          type
          description
          frequency
        }
      }
    }
  `);

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  if (result && result.data) {
    result.data.me.notifications = result.data.getNotificationPreferences;
  }

  return result.data.me;
}

export async function getUserStatusHistory(userId) {
  const result = await API(
    `
    query($userId: ID!) {
      userStatusHistory(userId: $userId) {
        userStatusId
        status
        game {
          ${GAME_FIELDS}
          ${NESTED_GAME_OWNER}
        }
      }
    }`,
    { userId }
  );
  if (result.error || result.errors) {
    return false;
  }
  return result.data.userStatusHistory;
}

export async function getInitialData() {
  const result = await API(`
    query {
      me {
        ${FULL_USER_FIELDS}
        ${GAME_ITEMS}
      }

      allGames {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }

      allUsers {
        userId
        name
        username
        createdTime
        photo {
          url
          imgixUrl
          height
          width
        }
      }

      featuredGames {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }
    }
  `);

  if (!result) {
    return false;
  }

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.data.me && result.data.me.userId) {
    amplitude.getInstance().setUserId(result.data.me.userId);
  }

  return result.data;
}

export async function logout() {
  const result = await API.graphqlAsync({
    query: `
      mutation {
        logout
      }
    `,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  NativeUtil.sendLuaEvent('CASTLE_SET_LOGGED_IN', false);
  await API.client.setTokenAsync(null);
  return true;
}

export async function getGameByUrl(url) {
  const variables = { url };

  let result = await API.graphqlAsync({
    query: `
    query GetGame($url: String!) {
      game(url: $url) {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }
    }
    `,
    variables,
  });

  if (result.errors && result.errors.length) {
    throw new Error(`Unable to resolve game url: ${result.errors[0].message}`);
  }
  return result.data.game;
}

export async function uploadImageAsync({ file }) {
  const variables = { file };
  const result = await API.graphqlAsync({
    query: `
      mutation($file: Upload!) {
        uploadFile(file: $file) {
          fileId
          hash
          name
          encoding
          mimeType
          userId
          user {
            userId
            username
            name
          }
          uploadedTime
          width
          height
          originUrl
          url
          imgixUrl
        }
      }
    `,
    variables,
  });

  // TODO(jim): Write a global error handler.
  if (result.error || result.errors || !result.data) {
    return false;
  }

  return result.data.uploadFile;
}

export async function setUserPhotoAsync({ userId, fileId }) {
  const variables = {
    userId,
    photoFileId: fileId,
  };
  const result = await API.graphqlAsync({
    query: `
      mutation ($userId: ID!, $photoFileId: ID!) {
       updateUser(
         userId: $userId
         user: { photoFileId: $photoFileId }
       ) {
         userId
         photo {
           url
           imgixUrl
         }
       }
      }
    `,
    variables,
  });

  // TODO(jim): Write a global error handler.
  if (result.error || result.errors || !result.data) {
    return false;
  }

  return result.data.updateUser;
}

export async function updateUserAsync({ userId, user }) {
  const variables = {
    userId,
    ...user,
    about: JSON.stringify(user.about),
  };
  const result = await API.graphqlAsync({
    query: `
      mutation ($userId: ID!, $about: String, $name: String, $websiteUrl: String, $itchUsername: String, $twitterUsername: String) {
       updateUser(
         userId: $userId
         user: {
           about: { rich: $about }
           name: $name
           websiteUrl: $websiteUrl
           itchUsername: $itchUsername
           twitterUsername: $twitterUsername
         }
       ) {
         userId
       }
      }
    `,
    variables,
  });

  // TODO(jim): Write a global error handler.
  if (result.error || result.errors || !result.data) {
    return false;
  }

  return result.data.updateUser;
}

function _validateRegisterGameResult(result) {
  if (result.errors && result.errors.length) {
    const error = result.errors[0];
    const code = error.extensions ? error.extensions.code : '';
    if (code === 'REGISTER_GAME_DUPLICATE_URL') {
      throw new Error(`A game already exists in Castle with this url.`);
    } else if (code === 'REGISTER_GAME_DUPLICATE_SLUG') {
      throw new Error(`You have already added a game with this name.`);
    } else if (code === 'REGISTER_GAME_INVALID_CASTLE_FILE') {
      throw new Error(`The file at this url doesn't look like a valid Castle project file.`);
    } else if (code === 'REGISTER_GAME_INVALID_USERNAME') {
      throw new Error(`The \`owner\` given at this url does not match your username.`);
    } else {
      throw new Error(error.message);
    }
  }
  return true;
}

export async function registerGameAtUrl(url) {
  const variables = {
    url,
  };

  const result = await API.graphqlAsync({
    query: `
      mutation RegisterGame($url: String!) {
        registerGame(url: $url) {
          ${GAME_FIELDS}
        }
      }
    `,
    variables,
  });

  _validateRegisterGameResult(result);
  return result.data.registerGame;
}

export async function previewGameAtUrl(url) {
  const variables = {
    url,
  };

  const result = await API.graphqlAsync({
    query: `
      query PreviewGame($url: String!) {
        previewGame(url: $url) {
          slug,
          name,
          url,
          owner {
            name,
            username,
          },
          coverImage {
            url
            imgixUrl
            height
            width
          },
          description,
          createdTime,
          updatedTime,
        }
      }
    `,
    variables,
  });

  _validateRegisterGameResult(result);
  return result.data.previewGame;
}

export async function updateGameAtUrl(url) {
  const variables = {
    url,
  };

  const result = await API.graphqlAsync({
    query: `
      mutation UpdateGame($url: String!) {
        updateGame(url: $url) {
          gameId,
          slug,
          name,
        }
      }
    `,
    variables,
  });

  _validateRegisterGameResult(result);
  return result.data.updateGame;
}

export async function recordUserStatus(status, isNewSession, game) {
  if (game.gameId) {
    return _recordUserStatusRegisteredGame(status, isNewSession, game.gameId);
  } else {
    return _recordUserStatusUnregisteredGame(status, isNewSession, game);
  }
}

async function _recordUserStatusUnregisteredGame(status, isNewSession, game) {
  let coverImageUrl;
  if (game.coverImage && game.coverImage.url) {
    coverImageUrl = game.coverImage.url;
  } else if (game.metadata && game.metadata.coverImage) {
    if (!Urls.isPrivateUrl(game.metadata.coverImage)) {
      coverImageUrl = game.metadata.coverImage;
    }
  } else if (game.metadata && game.metadata.coverImageUrl) {
    // coverImageUrl is deprecated
    if (!Urls.isPrivateUrl(game.metadata.coverImageUrl)) {
      coverImageUrl = game.metadata.coverImageUrl;
    }
  }
  const result = await API.graphqlAsync(
    /* GraphQL */ `
      mutation(
        $status: String!
        $url: String!
        $title: String
        $coverImage: String
        $isNewSession: Boolean
      ) {
        recordUserStatus(
          status: $status
          isNewSession: $isNewSession
          unregisteredGame: { url: $url, title: $title, coverImage: $coverImage }
        ) {
          userStatusId
        }
      }
    `,
    {
      status,
      isNewSession,
      url: game.url,
      title: game.title ? game.title : game.name, // name is deprecated
      coverImage: coverImageUrl,
    }
  );
  return result;
}

async function _recordUserStatusRegisteredGame(status, isNewSession, gameId) {
  const result = await API.graphqlAsync(
    /* GraphQL */ `
      mutation($status: String!, $isNewSession: Boolean, $registeredGameId: ID!) {
        recordUserStatus(
          status: $status
          isNewSession: $isNewSession
          registeredGameId: $registeredGameId
        ) {
          userStatusId
        }
      }
    `,
    {
      status,
      isNewSession,
      registeredGameId: gameId,
    }
  );
  return result;
}

export async function multiplayerJoinAsync(gameId, entryPoint, sessionId) {
  let result;
  try {
    result = await API.graphqlAsync(
      /* GraphQL */ `
        mutation($gameId: ID, $entryPoint: String, $sessionId: String) {
          joinMultiplayerSession(gameId: $gameId, entryPoint: $entryPoint, sessionId: $sessionId) {
            sessionId
            address
            isNewSession
          }
        }
      `,
      {
        gameId,
        entryPoint,
        sessionId,
      }
    );
  } catch (e) {
    return false;
  }

  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.joinMultiplayerSession;
}

export async function gameServerLogsAsync(gameId, entryPoint) {
  let result;
  try {
    result = await API.graphqlAsync(
      /* GraphQL */ `
        query($gameId: ID, $entryPoint: String) {
          gameServerLogs(gameId: $gameId, entryPoint: $entryPoint)
        }
      `,
      {
        gameId,
        entryPoint,
      }
    );
  } catch (e) {
    return false;
  }

  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.gameServerLogs;
}

export async function getAutocompleteAsync(text) {
  const result = await API(
    `
    query($text: String!) {
      autocomplete(text: $text) {
        users {
          userId
          username
          name
        }
      }
    }`,
    { text }
  );
  if (result.error || result.errors) {
    return false;
  }
  return result.data.autocomplete;
}

export async function getMultiplayerRegions() {
  const result = await API(
    `
    query {
      multiplayerRegions {
        name
        pingAddress
      }
    }`
  );
  if (result.error || result.errors) {
    return false;
  }
  return result.data.multiplayerRegions;
}

export async function updatePings(pings) {
  let result = await API.graphqlAsync(
    /* GraphQL */ `
      mutation($pings: [UserPing]!) {
        updatePings(pings: $pings)
      }
    `,
    {
      pings,
    }
  );
}
