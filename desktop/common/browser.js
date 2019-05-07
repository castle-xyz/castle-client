import * as Actions from '~/common/actions';
import * as NativeUtil from '~/native/nativeutil';
import * as Strings from '~/common/strings';
import * as Urls from '~/common/urls';
import * as Utilities from '~/common/utilities';
import * as ExecNode from '~/common/execnode';

import URL from 'url';
import metadatalib from 'castle-metadata';

function _validateMetadata(metadata, isRegistered) {
  if (!metadata) {
    throw new Error(`Metadata is invalid: ${metadata}`);
  }
  let validatedMetadata = { ...metadata };
  const registeredFields = ['gameId', 'owner', 'slug'];
  if (isRegistered) {
    registeredFields.forEach((field) => {
      if (!validatedMetadata.hasOwnProperty(field)) {
        throw new Error(`Registered game is missing field: ${field}`);
      }
    });
  } else {
    // unregistered games can't have any of these
    registeredFields.forEach((field) => {
      if (validatedMetadata.hasOwnProperty(field)) {
        delete validatedMetadata[field];
      }
    });
  }
  return validatedMetadata;
}

async function _resolveMetadataAtUrlAsync(metadataUrl) {
  try {
    let { metadata, info, errors, warnings } = await metadatalib.fetchMetadataForUrlAsync(
      metadataUrl,
      {
        readFileUrlAsyncFunction: NativeUtil.readFileUrl,
      }
    );
    if (errors && errors.length) {
      throw new Error(`Error fetching metadata: ${errors.join(',')}`);
    }
    metadata = _validateMetadata(metadata, false);
    return { metadata, info };
  } catch (e) {
    throw new Error(`Couldn't resolve metadata at .castle url: ${e.message}`);
  }
  return null;
}

async function _readGameFromMetadataUrlAsync(url) {
  let game = { url };
  const { metadata } = await _resolveMetadataAtUrlAsync(url);
  if (metadata) {
    game.metadata = metadata;
    if (metadata.title) game.title = metadata.title;
    if (metadata.description) game.description = metadata.description;
    if (metadata.owner) game.owner = metadata.owner;

    // TODO: remove deprecated name and username
    if (!game.title && metadata.name) game.title = metadata.name;
    if (!game.owner && metadata.username) game.owner = metadata.username;
  }
  return game;
}

/**
 *  opts.upload: if true, for a local gameUrl, upload the project at this gameUrl to
 *               a temporary castle hosted url.
 */
async function resolveGameAtUrlAsync(gameUrl, opts = {}) {
  let game;

  // always try to resolve from the server first
  try {
    game = await Actions.getGameByUrl(gameUrl);
  } catch (e) {
    game = null;
  }

  // if the server failed, try to read the .castle file directly
  if (!game && Urls.isMetadataFileUrl(gameUrl)) {
    try {
      game = await _readGameFromMetadataUrlAsync(gameUrl);
    } catch (e) {
      game = null;
    }
  }

  if (!game) {
    // if nothing worked, assume this is a direct url to some code with no metadata
    game = {
      url: gameUrl,
    };
  }

  // if game didn't come from the server, then parse the sessionId and format it correctly
  if (!game.gameId) {
    try {
      let parsedUrl = URL.parse(gameUrl);

      if (parsedUrl.hash) {
        game.sessionId = parsedUrl.hash.substr(1);
      }

      parsedUrl.hash = null;
      game.url = URL.format(parsedUrl);
      if (Utilities.isWindows()) {
        game.url = Utilities.fixWindowsFilePath(game.url);
      }
    } catch (e) {}
  }

  if (opts && opts.upload) {
    let hostedUrl;
    if (Urls.isPrivateUrl(gameUrl)) {
      try {
        hostedUrl = await ExecNode.uploadGameAsync(gameUrl);
      } catch (e) {
        throw new Error(`Unable to perform multiplayer auto upload: ${e.message}`);
      }
    }
    // `hostedUrl` will be considered when resolving the lua entry point for this game.
    // we do not want to override the original `game.url` field, because we'll forget
    // where the game originally was opened from and be unable to reload properly.
    game.hostedUrl = hostedUrl;
  }

  return game;
}

export { resolveGameAtUrlAsync };
