import * as url from 'url';
import ip from 'ip';

const isLua = (urlStr) => {
  return urlStr.endsWith('.lua');
};

const isOpenSource = (urlStr) => {
  let isOSS = false;
  try {
    const components = url.parse(urlStr);
    isOSS = components.hostname === 'raw.githubusercontent.com';
    // ... could do a better job here ...
  } catch (_) {}
  return isOSS;
};

const githubUserContentToRepoUrl = (urlStr) => {
  if (isOpenSource(urlStr)) {
    try {
      const matches = urlStr.match(
        /^(castle|https?):\/\/raw\.githubusercontent\.com\/([^/]*)\/([^/]*)\/([^/]*)/
      );
      if (matches) {
        return `https://github.com/${matches[2]}/${matches[3]}/tree/${matches[4]}`;
      }
    } catch (_) {}
  }
  return null;
};

const isPrivateUrl = (urlStr) => {
  // We would need to do a DNS lookup to be precise here
  // but we roughly approximate whether a URL is private
  // or not, by saying:
  // - Anything using the `file://` protocol is private
  // - `localhost` is private
  // - Any explicit IPv4 or IPv6 address in the private range is private
  // - Everything else is public (including URLs we don't understand)
  try {
    let components = url.parse(urlStr);
    return (
      components.protocol === 'file:' ||
      components.hostname === 'localhost' ||
      ip.isPrivate(components.hostname)
    );
  } catch (e) {
    // We can't parse the URL so we don't know what to do
    // We'll assume public
    return false;
  }
};

// return { urlToDisplay, urlToOpen }
//   urlToDisplay guarantees no scheme
//   urlToOpen guarantees some valid scheme
const canonizeUserProvidedUrl = (urlStr) => {
  let urlToDisplay, urlToOpen;
  try {
    const componentsToDisplay = url.parse(urlStr);
    const componentsToOpen = url.parse(urlStr);

    componentsToDisplay.protocol = '';
    urlToDisplay = url.format(componentsToDisplay);
    if (urlToDisplay.indexOf('//') === 0) {
      urlToDisplay = urlToDisplay.substring(2);
    }
    if (urlToDisplay.slice(-1) == '/') {
      urlToDisplay = urlToDisplay.substring(0, urlToDisplay.length - 1);
    }
    if (!componentsToOpen.protocol || componentsToOpen.protocol == '') {
      componentsToOpen.protocol = 'http:';
    }
    urlToOpen = url.format(componentsToOpen);
  } catch (_) {}
  return { urlToDisplay, urlToOpen };
};

const isCastleHostedUrl = (urlStr) => {
  let isCastle = false;
  try {
    const components = url.parse(urlStr);
    isCastle = (
      components.hostname === 'playcastle.io' ||
      components.hostname === 'www.playcastle.io'
    );
  } catch (_) {}
  return isCastle;
};

const parseIdFromCastleHostedUrl = (mediaUrl) => {
  let username, slug;
  try {
    const components = url.parse(mediaUrl);
    const pathComponents = components.pathname
          .split('/')
          .filter(pathComponent => pathComponent.length > 0);
    if (pathComponents[0].startsWith('@') && pathComponents.length >= 2) {
      username = pathComponents[0].substring(1);
      slug = pathComponents[1];
    } else {
      throw new Error(`${mediaUrl} is not a valid castle hosted url`);
    }
  } catch (e) {
    throw new Error(`Unable to parse castle user/slug: ${e}`);
  }
  return {
    username,
    slug
  };
};

export {
  canonizeUserProvidedUrl,
  githubUserContentToRepoUrl,
  isCastleHostedUrl,
  isPrivateUrl,
  isLua,
  isOpenSource,
  parseIdFromCastleHostedUrl,
};
