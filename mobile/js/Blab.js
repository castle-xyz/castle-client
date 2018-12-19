// Content-addressed files stored remotely and cached locally

import { FileSystem } from 'expo';
import firebase from 'react-native-firebase';

const cacheUriForId = id => `${FileSystem.cacheDirectory}blab-${id}`;

const rootRemoteRef = firebase.storage().ref('blabs');
const remoteRefForId = id => rootRemoteRef.child(id);

// Get the blab id this file would be uploaded at (but don't actually upload it)
export async function idForFile(localUri) {
  let { exists, md5 } = await FileSystem.getInfoAsync(localUri, { md5: true });
  if (!exists) {
    throw new Error("`Blab.put`: file doesn't exist");
  }
  const extensionMatch = localUri.match(/[^.]*$/);
  if (!extensionMatch) {
    throw new Error("`Blab.put`: filename doesn't have an extension");
  }
  return `${md5}.${extensionMatch[0]}`;
}

// Upload a blab with contents given by the local file at `localUri`. Returns the blab id.
export async function put(localUri) {
  const id = await idForFile(localUri);
  const ref = remoteRefForId(id);

  // Copy to cache location so that next access doesn't download again
  const copyingToCache = FileSystem.copyAsync({ from: localUri, to: cacheUriForId(id) });

  // Already uploaded?
  try {
    await ref.getDownloadURL(); // Throws an error if `ref` points to a non-existent resource
    await copyingToCache;
    return id;
  } catch (e) {}

  // Wasn't already uploaded, upload now
  try {
    await Promise.all([ref.putFile(localUri), copyingToCache]);
    return id;
  } catch (e) {
    throw new Error(`\`Blab.put\`: ${e.message}`);
  }
}

// Get a local URI to a cache file with the contents of a blab with id `id`.
export async function get(id) {
  const cacheUri = cacheUriForId(id);
  try {
    let { exists } = await FileSystem.getInfoAsync(cacheUri);
    if (!exists) {
      await FileSystem.downloadAsync(await remoteRefForId(id).getDownloadURL(), cacheUri);
    }
    return cacheUri;
  } catch (e) {
    throw new Error(`\`Blab.get\`: ${e.message}`);
  }
}
