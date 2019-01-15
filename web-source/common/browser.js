import metadatalib from 'castle-metadata';

import * as Actions from '~/common/actions';
import * as CEF from '~/common/cef';
import * as Urls from '~/common/urls';

function _validateMetadata(metadata, isRegistered) {
  if (!metadata) {
    throw new Error(`Metadata is invalid: ${metadata}`);
  }
  let validatedMetadata = { ...metadata };
  if (isRegistered) {
    // TODO: enforce mediaId
  } else {
    // unregistered media can't have any of these
    const fieldsToRemove = [ 'mediaId', 'user', 'slug' ];
    fieldsToRemove.forEach(field => {
      if (validatedMetadata.hasOwnProperty(field)) {
        delete validatedMetadata[field];
      }
    });
  }
  return validatedMetadata;
};

async function resolveMediaAtUrlAsync(mediaUrl) {
  let metadataUrl = mediaUrl;
  let entryPoint = mediaUrl;
  let metadataFetched = {};
  let isRegisteredMedia = false;

  if (Urls.isCastleHostedUrl(mediaUrl)) {
    try {
      // look up underlying .castle url to retrieve metadata
      let { username, slug } = Urls.parseIdFromCastleHostedUrl(mediaUrl);
      metadataUrl = await Actions.getPrimaryUrlForRegisteredMediaByIdAsync(username, slug);
      if (metadataUrl) {
        isRegisteredMedia = true;
      }
    } catch (e) {
      // this didn't work, try to get metadata from the original url
      metadataUrl = mediaUrl;
    }
  }

  try {
    let {
      metadata,
      info,
      errors,
      warnings
    } = await metadatalib.fetchMetadataForUrlAsync(metadataUrl, {
      readFileUrlAsyncFunction: CEF.readFileUrl,
    });
    if (errors && errors.length) {
      throw new Error(`Error fetching metadata: ${errors.join(',')}`);
    } else {
      if (info && info.isPublicUrl) {
        // If its a public URL, index it on the server
        // Don't `await` since we don't want to block
        // loading the media
        Actions.indexPublicUrlAsync(metadataUrl);
      }
      if (info && info.main) {
        entryPoint = info.main;
      }
    }
    metadataFetched = _validateMetadata(metadata, isRegisteredMedia);
  } catch (e) {
    console.warn(`Couldn't fetch metadata when opening Castle url: ${e}`);
  }
  return {
    mediaUrl,
    entryPoint,
    ...metadataFetched,
  };
};

export {
  resolveMediaAtUrlAsync,
};
