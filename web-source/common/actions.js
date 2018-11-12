import CastleApiClient from 'castle-api-client';

// export const API = CastleApiClient('http://localhost:1380');
// export const API = CastleApiClient('https://ghost-server.app.render.com');
// export const API = CastleApiClient('http://api.playcastle.io');
// export const API = CastleApiClient('https://apis.playcastle.io');
// export const API = CastleApiClient();

let maybeAPI;
try {
  maybeAPI = CastleApiClient('https://apis.playcastle.io');
} catch (e) {}

export const API = maybeAPI;

// fetches partial user data to support some owning object
const NESTED_USER = `
  user {
    userId
    name
    username
    isReal
    photo {
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
  isReal
  about
  photo {
    imgixUrl
    height
    width
  }
`;

const MEDIA_ITEMS = `
  mediaItems {
    name
    published
    createdTime
    instructions
    description
    mediaUrl
    mediaId
    jamVotingUrl
    coverImage {
      url
      imgixUrl
      height
      width
    }
    ${NESTED_USER}
  }
`;

const PLAYLISTS = `
  playlists {
    playlistId
    name
    description
    createdTime
    coverImage {
      url
      imgixUrl
      height
      width
    }
    ${NESTED_USER}
    ${MEDIA_ITEMS}
  }
`;

export const delay = ms =>
  new Promise(resolve => {
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
          ${PLAYLISTS}
          ${MEDIA_ITEMS}
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

  return response;
}

export async function login({ userId, password }) {
  const response = await API.graphqlAsync(
    `
      mutation($userId: ID!, $password: String!) {
        login(userId: $userId, password: $password) {
          ${FULL_USER_FIELDS}
          ${PLAYLISTS}
          ${MEDIA_ITEMS}
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

  return response.data.login;
}

export async function getPlaylist({ playlistId }) {
  const variables = { playlistId };
  const result = await API(
    `
    query GetPlaylist($playlistId: ID!) {
      playlist(playlistId: $playlistId) {
        playlistId
        name
        description
        createdTime
        coverImage {
          imgixUrl
          height
          width
        }
        ${NESTED_USER}
        ${MEDIA_ITEMS}
      }
    }
  `,
    variables
  );

  if (!result) {
    return false;
  }

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.playlist;
}

export async function getUser({ userId }) {
  const variables = { userId };
  const result = await API(
    `
    query GetUser($userId: ID!) {
      user(userId: $userId) {
        ${FULL_USER_FIELDS}
        ${PLAYLISTS}
        ${MEDIA_ITEMS}
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

export async function getViewer() {
  const result = await API(`
    query {
      me {
        ${FULL_USER_FIELDS}
        ${MEDIA_ITEMS}
        ${PLAYLISTS}
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

  return result.data.me;
}

export async function getInitialData() {
  const result = await API(`
    query {
      me {
        ${FULL_USER_FIELDS}
        ${MEDIA_ITEMS}
        ${PLAYLISTS}
      }

      allMedia {
        name
        published
        createdTime
        description
        mediaUrl
        mediaId
        jamVotingUrl
        coverImage {
          url
          height
          width
        }
        ${NESTED_USER}
      }

      allUsers {
        userId
        name
        username
        createdTime
        isReal
        photo {
          imgixUrl
          height
          width
        }
      }

      allPlaylists {
        playlistId
        name
        description
        createdTime
        coverImage {
          height
          width
          imgixUrl
        }
        ${NESTED_USER}
        ${MEDIA_ITEMS}
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

export async function search(query) {
  const result = await API.graphqlAsync({
    query: `
      query SearchMediaAndPlaylists(
        $query: String
        $cursorPosition: Int
        $limit: Int
      ) {
        searchMediaAndPlaylists(
          query: $query
          cursorPosition: $cursorPosition
          limit: $limit
        ) {
          ${MEDIA_ITEMS}
          ${PLAYLISTS}
        }
      }
    `,
    variables: { query },
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.searchMediaAndPlaylists;
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

  return true;
}

export async function getMediaByURL({ mediaUrl }) {
  const variables = { mediaUrl };

  let result;
  try {
    result = await API.graphqlAsync({
      query: `
      query GetMediaByURL($mediaUrl: String!) {
        mediaByMediaUrl(mediaUrl: $mediaUrl) {
          name
          published
          createdTime
          instructions
          description
          mediaUrl
          mediaId
          jamVotingUrl
          coverImage {
            url
            height
            width
          }
          ${NESTED_USER}
        }
      }
      `,
      variables,
    });
  } catch (e) {
    return false;
  }

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.mediaByMediaUrl;
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
      mutation ($userId: ID!, $about: String!, $name: String!, $websiteUrl: String!, $itchUsername: String!, $twitterUsername: String!) {
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

export async function addMedia({ name, url, description }) {
  const variables = {
    name,
    mediaUrl: url,
    description: JSON.stringify(description),
  };

  const result = await API.graphqlAsync({
    query: `
      mutation AddMedia($name: String, $mediaUrl: String, $description: String) {
        addMedia(media: {
          name: $name
          mediaUrl: $mediaUrl
          description: {
            rich: $description
          }
        }) {
          mediaId
        }
      }
    `,
    variables,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.addMedia;
}

export async function addPlaylist({ name, description }) {
  const variables = { name, description: JSON.stringify(description) };

  const result = await API.graphqlAsync({
    query: `
      mutation AddPlaylist($name: String, $description: String) {
        addPlaylist(playlist: {
          name: $name
          description: {
            rich: $description
          }
        }) {
          playlistId
        }
      }
    `,
    variables,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.addPlaylist;
}

export async function addMediaToPlaylist({ mediaId, playlistId }) {
  const variables = { mediaId, playlistId };

  const result = await API.graphqlAsync({
    query: `
      mutation AddPlaylistMediaItem($mediaId: ID!, $playlistId: ID!) {
        addPlaylistMediaItem(mediaId: $mediaId, playlistId: $playlistId) {
          playlistId
        }
      }
    `,
    variables,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.addPlaylistMediaItem;
}

export async function removeMediaFromPlaylist({ mediaId, playlistId }) {
  const variables = { mediaId, playlistId };

  const result = await API.graphqlAsync({
    query: `
      mutation RemovePlaylistMediaItem($mediaId: ID!, $playlistId: ID!) {
        removePlaylistMediaItem(mediaId: $mediaId, playlistId: $playlistId) {
          playlistId
        }
      }
    `,
    variables,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return result.data.removePlaylistMediaItem;
}

export async function removeMedia({ mediaId }) {
  const variables = { mediaId };

  const result = await API.graphqlAsync({
    query: `
      mutation RemoveMedia($mediaId: ID!) {
        deleteMedia(mediaId: $mediaId)
      }
    `,
    variables,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return { mediaId };
}

export async function removePlaylist({ playlistId }) {
  const variables = { playlistId };

  const result = await API.graphqlAsync({
    query: `
      mutation RemovePlaylist($playlistId: ID!) {
        deletePlaylist(playlistId: $playlistId)
      }
    `,
    variables,
  });

  // TOOD(jim): Write a global error handler.
  if (result.error) {
    return false;
  }

  if (result.errors) {
    return false;
  }

  return { playlistId };
}

export async function recordUserplayEndAsync(userplayId) {
  let result = await API.graphqlAsync(
    /* GraphQL */ `
      mutation($userplayId: ID!) {
        recordUserplayEnd(userplayId: $userplayId) {
          userId
        }
      }
    `,
    {
      userplayId,
    }
  );
}

export async function recordUserplayStartAsync(mediaUrl, mediaId) {
  return await API.graphqlAsync(
    /* GraphQL */ `
      mutation($mediaId: ID, $mediaUrl: String) {
        recordUserplayStart(mediaId: $mediaId, mediaUrl: $mediaUrl) {
          userplayId
        }
      }
    `,
    {
      mediaId,
      mediaUrl,
    }
  );
}

export async function recordUserplayPingAsync(userplayId) {
  return await API.graphqlAsync(
    /* GraphQL */ `
      mutation($userplayId: ID!) {
        recordUserplayPing(userplayId: $userplayId) {
          userplayId
        }
      }
    `,
    {
      userplayId,
    }
  );
}

export async function startTrackingUserplayAsync(data) {
  if (API._currentUserplayId) {
    await recordUserplayEndAsync(API._currentUserplayId);
    API._currentUserplayId = null;
  }
  let { mediaId, mediaUrl } = data;
  let result = await recordUserplayStartAsync(mediaUrl, mediaId);
  API._currentUserplayId =
    result.data && result.data.recordUserplayStart && result.data.recordUserplayStart.userplayId;
  if (API._currentUserplayPingInterval) {
    clearInterval(API._currentUserplayPingInterval);
  }
  API._currentUserplayPingInterval = setInterval(
    () => {
      if (API._currentUserplayId) {
        recordUserplayPingAsync(API._currentUserplayId);
      }
    },
    // ping every 25 seconds
    25 * 1000
    // 3 * 1000
  );
}
