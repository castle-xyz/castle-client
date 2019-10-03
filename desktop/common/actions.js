import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import * as url from 'url';

import CastleApiClient from 'castle-api-client';

export const API = CastleApiClient(Constants.API_HOST);

// fetches partial user data to support some owning object
const NESTED_GAME_OWNER = `
  owner {
    userId
    name
    username
    gamesCount
    gamesSumPlayCount
    photo {
      url
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
  email
  websiteUrl
  itchUsername
  twitterUsername
  createdTime
  updatedTime
  about
  gamesCount
  gamesSumPlayCount
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
    height
    width
  }
`;

const GAME_FIELDS = `
  gameId
  title
  url
  sourceUrl
  isCastleHosted
  slug
  createdTime
  updatedTime
  description
  metadata
  entryPoint
  serverEntryPoint
  sessionId
  playCount
  coverImage {
    url
    height
    width
  }
  draft
  storageId
  chatChannelId
`;

const GAME_ITEMS = `
  gameItems {
    ${GAME_FIELDS}
    ${NESTED_GAME_OWNER}
  }
`;

const POST_FIELDS = `
  postId
  creator {
    userId
    username
    name
    photo {
      url
    }
  }
  message
  media {
    url
    width
    height
  }
  hasData
  url
  createdTime
`;

const NOTIFICATION_FIELDS = `
  appNotificationId
  type
  body
  status
  chatMessageId
  chatChannelId
  gameId
  authorUserId
  postId
  updatedTime
`;

const CURRENT_USER_QUERY = `
  me {
    ${FULL_USER_FIELDS}
    ${GAME_ITEMS}
  }

  getNotificationPreferences {
    email {
      type
      description
      frequency
      supportedFrequencies
    }
    desktop {
      type
      description
      frequency
      supportedFrequencies
    }
  }

  userStatusHistory {
    userStatusId
    status
    lastPing
    game {
      ${GAME_FIELDS}
      ${NESTED_GAME_OWNER}
    }
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

export async function getUserByUsername({ username }) {
  const response = await API.graphqlAsync(
    `
      query($who: String!) {
        userForLoginInput(who: $who) {
          ${FULL_USER_FIELDS}
        }
      }
    `,
    { who: username }
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

export async function getCurrentUser() {
  const result = await API(`
    query {
      ${CURRENT_USER_QUERY}
    }
  `);
  if (result.error || result.errors) {
    return result;
  }
  return {
    user: result.data.me,
    settings: {
      notifications: result.data.getNotificationPreferences,
    },
    userStatusHistory: result.data.userStatusHistory,
  };
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

export async function getAllGames(limit) {
  const result = await API(
    `
    query($limit: Int) {
      allGames(limit: $limit) {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }
    }`,
    { limit }
  );

  if (!result) {
    return false;
  }

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  return result.data;
}

export async function getInitialData() {
  const result = await API(
    `
    query {
      ${CURRENT_USER_QUERY}

      trendingGames {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }

      featuredExamples {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }

      appNotifications {
        ${NOTIFICATION_FIELDS}
      }
    }
  `
  );

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

export async function getTrendingGames() {
  const result = await API(`
    query {
      trendingGames {
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

  await API.client.setTokenAsync(null);
  return true;
}

export async function getGameByURL(url) {
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

export async function getGameByGameId(gameId) {
  const variables = { gameId };

  let result = await API.graphqlAsync({
    query: `
    query GetGame($gameId: ID!) {
      game(gameId: $gameId) {
        ${GAME_FIELDS}
        ${NESTED_GAME_OWNER}
      }
    }
    `,
    variables,
  });

  if (result.errors && result.errors.length) {
    throw new Error(`\`getGameByGameId\`: ${result.errors[0].message}`);
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

function _validatePublishGameResult(result) {
  if (result.errors && result.errors.length) {
    const error = result.errors[0];
    const code = error.extensions ? error.extensions.code : '';
    if (code === 'REGISTER_GAME_DUPLICATE_URL') {
      throw new Error(`A game already exists in Castle with this url.`);
    } else if (code === 'REGISTER_GAME_DUPLICATE_SLUG') {
      throw new Error(`You have already added a game with this name.`);
    } else if (code === 'REGISTER_GAME_INVALID_CASTLE_FILE') {
      if (error.message == 'Owner must not be empty') {
        throw new Error(`The given Castle project file is missing the 'owner' field.`);
      } else {
        throw new Error(`The file at this url doesn't look like a valid Castle project file.`);
      }
    } else if (code === 'REGISTER_GAME_INVALID_USERNAME') {
      throw new Error(`The \`owner\` given at this url does not match your username.`);
    } else {
      throw new Error(`The Castle server returned an error: ${error.message}`);
    }
  }
  return true;
}

// read the game at this source url and try to publish it to my account.
// optional gameId means we intend to update an existing game.
export async function publishGame(sourceUrl, gameId = null) {
  const result = await API.graphqlAsync({
    query: `
      mutation($url: String!, $gameId: ID) {
        publishGame(url: $url, gameId: $gameId) {
          ${GAME_FIELDS}
        }
      }
    `,
    variables: {
      url: sourceUrl,
      gameId,
    },
  });

  _validatePublishGameResult(result);
  return result.data.publishGame;
}

export async function previewLocalGame(castleFileContents, gameId = null) {
  const result = await API.graphqlAsync({
    query: `
      query PreviewLocalGame($castleFile: String!, $gameId: ID) {
        previewLocalGame(castleFile: $castleFile, gameId: $gameId) {
          ${GAME_FIELDS}
          ${NESTED_GAME_OWNER}
        }
      }
    `,
    variables: {
      castleFile: castleFileContents,
      gameId,
    },
  });

  _validatePublishGameResult(result);
  return result.data.previewLocalGame;
}

export async function previewGameAtUrl(url, gameId = null) {
  const result = await API.graphqlAsync({
    query: `
      query PreviewGameAtUrl($url: String!, $gameId: ID) {
        previewGameAtUrl(url: $url, gameId: $gameId) {
          ${GAME_FIELDS}
          ${NESTED_GAME_OWNER}
        }
      }
    `,
    variables: { url, gameId },
  });

  _validatePublishGameResult(result);
  return result.data.previewGameAtUrl;
}

export async function updateGameAtUrl(url) {
  // TODO: BEN: remove
  throw new Error(`DELETE ME`);
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
    let resolvedUrl = url.resolve(game.url, game.metadata.coverImage);
    if (!Urls.isPrivateUrl(resolvedUrl)) {
      coverImageUrl = resolvedUrl;
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

export async function multiplayerJoinAsync(
  gameId,
  castleFileUrl,
  entryPoint,
  sessionId,
  isStaging
) {
  let result;
  try {
    result = await API.graphqlAsync(
      /* GraphQL */ `
        mutation(
          $gameId: ID
          $castleFileUrl: String
          $entryPoint: String
          $sessionId: String
          $isStaging: Boolean
        ) {
          joinMultiplayerSession(
            gameId: $gameId
            castleFileUrl: $castleFileUrl
            entryPoint: $entryPoint
            sessionId: $sessionId
            isStaging: $isStaging
          ) {
            sessionId
            address
            isNewSession
            sessionToken
          }
        }
      `,
      {
        gameId,
        castleFileUrl,
        entryPoint,
        sessionId,
        isStaging,
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

export async function gameServerLogsAsync(gameId, castleFileUrl, entryPoint) {
  let result;
  try {
    result = await API.graphqlAsync(
      /* GraphQL */ `
        query($gameId: ID, $castleFileUrl: String, $entryPoint: String) {
          gameServerLogs(gameId: $gameId, castleFileUrl: $castleFileUrl, entryPoint: $entryPoint)
        }
      `,
      {
        gameId,
        castleFileUrl,
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

export async function getGameGlobalStorageValueAsync({ storageId, key }) {
  const result = await API.graphqlAsync(
    `
      query($storageId: String!, $key: String!) {
        gameGlobalStorage(storageId: $storageId, key: $key) {
          value
        }
      }
    `,
    { storageId, key }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`getGameGlobalStorageValueAsync\`: ${result.errors[0].message}`);
  }

  return result.data.gameGlobalStorage;
}

export async function setGameGlobalStorageAsync({ storageId, key, value }) {
  const result = await API.graphqlAsync(
    `
      mutation($storageId: String!, $key: String!, $value: String) {
        setGameGlobalStorage(storageId: $storageId, key: $key, value: $value)
      }
    `,
    { storageId, key, value }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`setGameGlobalStorageAsync\`: ${result.errors[0].message}`);
  }

  return result.data.setGameGlobalStorage;
}

export async function getGameUserStorageValueAsync({ storageId, key }) {
  const result = await API.graphqlAsync(
    `
      query($storageId: String!, $key: String!) {
        gameUserStorage(storageId: $storageId, key: $key) {
          value
        }
      }
    `,
    { storageId, key }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`getGameUserStorageValueAsync\`: ${result.errors[0].message}`);
  }

  return result.data.gameUserStorage;
}

export async function setGameUserStorageAsync({ storageId, key, value }) {
  const result = await API.graphqlAsync(
    `
      mutation($storageId: String!, $key: String!, $value: String) {
        setGameUserStorage(storageId: $storageId, key: $key, value: $value)
      }
    `,
    { storageId, key, value }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`setGameUserStorageAsync\`: ${result.errors[0].message}`);
  }

  return result.data.setGameUserStorage;
}

export async function createPostAsync({ sourceGameId, message, mediaFileId, data }) {
  const result = await API.graphqlAsync(
    `
      mutation($sourceGameId: ID, $message: Json, $mediaFileId: ID, $data: String) {
        createPost(
          postInput: {
            sourceGameId: $sourceGameId
            message: $message
            mediaFileId: $mediaFileId
            data: $data
          }
        ) {
          postId
        }
      }
    `,
    { sourceGameId, message, mediaFileId, data }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`createPostAsync\`: ${result.errors[0].message}`);
  }

  return result.data.createPost.postId;
}

export async function appNotificationsAsync() {
  const result = await API.graphqlAsync(`
      query {
        appNotifications {
          ${NOTIFICATION_FIELDS}
        }
      }
    `);
  if (result.errors && result.errors.length) {
    throw new Error(`appNotificationsAsync: ${result.errors[0].message}`);
  }
  return result.data.appNotifications;
}

export async function allPostsAsync({ pageSize = 20, pageAfterPostId } = {}) {
  const result = await API.graphqlAsync(
    `
      query($pageSize: Int, $pageAfterPostId: ID) {
        allPosts(pageSize: $pageSize, pageAfterPostId: $pageAfterPostId) {
          ${POST_FIELDS}
          sourceGame {
            ${GAME_FIELDS}
          }
        }
      }
    `,
    { pageSize, pageAfterPostId }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`allPostsAsync\`: ${result.errors[0].message}`);
  }

  return result.data.allPosts;
}

export async function postsForGameId(gameId, { pageSize = 20, pageAfterPostId } = {}) {
  const result = await API.graphqlAsync(
    `
      query($gameId: ID!, $pageSize: Int, $pageAfterPostId: ID) {
        postsForGame(gameId: $gameId, pageSize: $pageSize, pageAfterPostId: $pageAfterPostId) {
          ${POST_FIELDS}
        }
      }
    `,
    { gameId, pageSize, pageAfterPostId }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`postsForGame: ${result.errors[0].message}`);
  }

  return result.data.postsForGame;
}

export async function postsForUserId(userId, { pageSize = 20, pageAfterPostId } = {}) {
  const result = await API.graphqlAsync(
    `
      query($userId: ID!, $pageSize: Int, $pageAfterPostId: ID) {
        postsForUser(userId: $userId, pageSize: $pageSize, pageAfterPostId: $pageAfterPostId) {
          ${POST_FIELDS}
        }
      }
    `,
    { userId, pageSize, pageAfterPostId }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`postsForUser: ${result.errors[0].message}`);
  }

  return result.data.postsForUser;
}

export async function postDataAsync({ postId }) {
  const result = await API.graphqlAsync(
    `
      query($postId: ID!) {
        post(postId: $postId) {
          data
        }
      }
    `,
    { postId }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`postDataAsync\`: ${result.errors[0].message}`);
  }

  return result.data.post.data;
}

export async function getPostById(postId) {
  const result = await API.graphqlAsync(
    `
      query($postId: ID!) {
        post(postId: $postId) {
          ${POST_FIELDS}
          sourceGame {
            ${GAME_FIELDS}
          }
        }
      }
    `,
    { postId }
  );

  if (result.errors && result.errors.length) {
    return false;
  }

  return result.data.post;
}

export async function search(query) {
  const result = await API.graphqlAsync(
    `query($text: String!) {
      search(text: $text) {
        users {
          ${FULL_USER_FIELDS}
        }
        games {
          ${GAME_FIELDS}
          ${NESTED_GAME_OWNER}
        }
      }
    }`,
    { text: query }
  );
  if (result.errors && result.errors.length) {
    return false;
  }
  return {
    query,
    ...result.data.search,
  };
}

export async function getMediaServiceAsync(metadata) {
  const result = await API.graphqlAsync(
    `
      query($metadata: Json) {
        mediaService(metadata: $metadata) {
          type
          address
        }
      }
    `,
    { metadata }
  );

  if (result.errors && result.errors.length) {
    throw new Error(`\`getMediaServiceAsync\`: ${result.errors[0].message}`);
  }

  return result.data.mediaService;
}
