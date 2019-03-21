import platform from 'platform';
import url from 'url';

const LUMINOSITY_THEME_BREAKPOINT = 0.62;

export const shadeHex = (color, percent) => {
  const f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
};

export const getLuminosityOfHex = (hex) => {
  const c = hex.substring(1); // strip #
  const rgb = parseInt(c, 16); // convert - rrggbb to decimal
  const r = (rgb >> 16) & 0xff; // extract - red
  const g = (rgb >> 8) & 0xff; // extract - green
  const b = (rgb >> 0) & 0xff; // extract - blue
  const luminosity = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

  // NOTE(jim): Match IMGIX conversion
  return (luminosity / 2) * 0.01;
};

export const adjustTextColor = (hex) => {
  const luminosity = hex ? getLuminosityOfHex(hex) : LUMINOSITY_THEME_BREAKPOINT;
  return luminosity > LUMINOSITY_THEME_BREAKPOINT
    ? 'rgba(0, 0, 0, 0.8)'
    : 'rgba(255, 255, 255, 0.8)';
};

export const getColorTypeFromHex = (hex) => {
  const luminosity = hex ? getLuminosityOfHex(hex) : LUMINOSITY_THEME_BREAKPOINT;
  return luminosity > LUMINOSITY_THEME_BREAKPOINT ? 'DARK' : 'LIGHT';
};

export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function isWindows() {
  const os = platform.os.toString();
  return os.toLowerCase().includes('windows');
}

function _splitRemoveEmpty(str, sep) {
  let components = str.split(sep);
  while (components.length && components[0].length == 0) {
    components.splice(0, 1);
  }
  return components;
}

// fix a broken file path generated by calling url.resolve() or url.format() on windows
export function fixWindowsFilePath(path) {
  if (path.startsWith('file://')) {
    // broken paths look something like file://c/Users/...
    let filePath = path.substring(7);
    let pathComponents = _splitRemoveEmpty(filePath, '/');
    if (!(pathComponents.length > 1)) {
      pathComponents = _splitRemoveEmpty(filePath, '\\');
    }
    if (pathComponents.length > 1) {
      let mount = pathComponents[0].toString().toUpperCase();
      if (mount[mount.length - 1] !== ':') {
        mount = `${mount}:`;
      }
      pathComponents[0] = mount;
      filePath = pathComponents.join('\\');
    }
    return `file://${filePath}`;
  }
  return path;
}

export function getLuaEntryPoint(game) {
  if (game.entryPoint) {
    // if the server knows about this game, just use the value given by the server
    return game.entryPoint;
  }
  if (!game.url) {
    throw new Error(`Can't resolve lua entry point against this game url: ${game.url}`);
  }
  let entryPoint;
  if (game.metadata && game.metadata.main) {
    entryPoint = url.resolve(game.url, game.metadata.main);
    entryPoint = decodeURIComponent(entryPoint);
  } else {
    entryPoint = game.url;
  }
  if (isWindows() && entryPoint) {
    entryPoint = fixWindowsFilePath(entryPoint);
  }
  return entryPoint;
}
