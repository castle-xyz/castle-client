//export const API_HOST = 'https://apis.playcastle.io';
export const API_HOST = 'http://localhost:1380';

export const font = {
  default: `-apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica,
    ubuntu, roboto, noto, segoe ui, arial, sans-serif`,
  mono: `Consolas, monaco, monospace`,
};

export const base = {
  white: `#ffffff`,
  black: `#010101`,
  green: `#26B21C`,
  purple: '#6B1AB2',
  yellow: `#F7D002`,
  red: `#C63019`,
  gray: `#ececec`,
  blue: '#033888',
};

export const colors = {
  black: base.black,
  white80: `rgba(255, 255, 255, 0.8)`,
  white60: `rgba(255, 255, 255, 0.6)`,
  white40: `rgba(255, 255, 255, 0.4)`,
  white30: `rgba(255, 255, 255, 0.3)`,
  white25: `rgba(255, 255, 255, 0.25)`,
  white20: `rgba(255, 255, 255, 0.2)`,
  white10: `rgba(255, 255, 255, 0.1)`,
  black90: `rgba(0, 0, 0, 0.9)`,
  black80: `rgba(0, 0, 0, 0.8)`,
  black70: `rgba(0, 0, 0, 0.7)`,
  black60: `rgba(0, 0, 0, 0.6)`,
  black40: `rgba(0, 0, 0, 0.4)`,
  black30: `rgba(0, 0, 0, 0.3)`,
  black20: `rgba(0, 0, 0, 0.2)`,
  black10: `rgba(0, 0, 0, 0.1)`,
  background: base.black,
  foreground: `#222`,
  border: `#232323`,
  card: `#444`,
  subdued: '#666',
  white: base.white,
  green: base.green,
  blue: base.blue,
  blueLighter: '#1263dc',
  yellow: base.yellow,
  purple: base.purple,
  red: base.red,
  selected: base.yellow,
  secondaryButtonSelected: '#B2BABB',
};

export const brand = {
  background: base.black,
  foreground: colors.card,
  line: colors.foreground,
};

export const TRANSPARENT_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
