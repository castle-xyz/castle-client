export const API_HOST = 'https://staging.api.castle.games';
export const WEB_HOST = 'https://castle.games';

export const brand = {
  fuchsia: `#ff00ff`,
  yellow: `#feff00`,
};

export const colors = {
  text: `#000`,
  text2: `#6e6e6e`,
  border: `#000`,
  background: `#f7f3f1`,
  background3: `#c1bcbb`,
  background4: `#a7a2a2`,
  backgroundLeftContext: `#212121`,
  backgroundNavigation: `#141414`,
  white: `#fff`,
  black: `#000`,
  action: `#0530ad`,
  actionHover: `#0062ff`,
  searchEmphasis: `#0062ff`,
  error: '#f00',
  userStatus: {
    online: `#62D96B`,
    // online: `#2EE6D6`, -- cyan option
    offline: `#666`,
  },
  brand1: `#00ffff`, // cyan
  darkcyan: `#00eded`,
  brand2: brand.fuchsia, // fuschsia
  brand3: '#8F79D8', // violet
  brand4: brand.yellow, // yellow
};

export const logs = {
  default: colors.white,
  error: colors.error,
  system: brand.fuchsia,
};

export const typescale = {
  lvl1: '4.209rem', // 67.34px - mobile: 50.50px
  lvl2: '3.157rem', // 50.52px - mobile: 37.89px
  lvl3: '2.369rem', // 37.90px - mobile: 28.42px
  lvl4: '1.777rem', // 28.43px - mobile: 16.00px
  lvl5: '1.333rem', // 21.33px - mobile: 12.00px
  lvl6: '1rem', //---- 16.00px - mobile: 9.00px
  lvl7: '0.75rem', //- 12.00px - mobile: 6.75px
  base: '1rem',
};

export const linescale = {
  lvl1: '1',
  lvl2: '1',
  lvl3: '1.2',
  lvl4: '1.25',
  lvl5: '1.45',
  lvl6: '1.5',
  lvl7: '1.5',
  base: '1.5',
};

export const font = {
  game: `'game-heading', -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica,  ubuntu, roboto, noto, segoe ui, arial, sans-serif`,
  castle: `'logo-heading', -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica,  ubuntu, roboto, noto, segoe ui, arial, sans-serif`,
  system: `-apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica,  ubuntu, roboto, noto, segoe ui, arial, sans-serif`,
  default: `'sf-body', -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica,  ubuntu, roboto, noto, segoe ui, arial, sans-serif`,
  heading: `'sf-heading', -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica,  ubuntu, roboto, noto, segoe ui, arial, sans-serif`,
  mono: `'sf-mono', Consolas, monaco, monospace`,
  monobold: `'sf-mono-bold', Consolas, monaco, monospace`,
};

export const toolsTheme = {
  global: {
    colors: {
      active: 'rgba(102,102,102,0.5)',
      background: '#020202',
      black: '#000000',
      brand: colors.brand2,
      control: {
        dark: colors.brand4,
        light: '#403216',
      },
      focus: colors.brand4,
      icon: {
        dark: '#f8f8f8',
        light: '#666666',
      },
      placeholder: '#AAAAAA',
      text: {
        dark: '#eeeeee',
        light: '#444444',
      },
      white: '#FFFFFF',
      'accent-1': colors.brand2,
      'accent-2': colors.brand1,
      'accent-3': colors.brand3,
      'accent-4': colors.brand4,
      'neutral-1': '#EB6060',
      'neutral-2': '#01C781',
      'neutral-3': '#6095EB',
      'neutral-4': '#FFB200',
      'status-critical': '#FF3333',
      'status-error': '#FF3333',
      'status-warning': '#F7E464',
      'status-ok': '#7DD892',
      'status-unknown': '#a8a8a8',
      'status-disabled': '#a8a8a8',
    },
    drop: {
      background: '#333333',
    },
    focus: {
      border: {
        color: [null, ';'],
        width: '2px',
      },
    },
    font: {
      family: font.mono,
    },
    input: {
      weight: 700,
    },
  },
  anchor: {
    color: 'control',
  },
  layer: {
    background: '#111111',
    overlay: {
      background: 'rgba(48,48,48,0.5)',
    },
  },
};

export const TRANSPARENT_GIF_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const GAME_LOADING_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAS0AAABOCAIAAAD6ltf5AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGzGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMjgwMTE3NDA3MjA2ODExOUJFRkU5NkIyOENERDkwOCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmYzZjc5MjY5LTM1ZTAtNWQ0My04ZmJlLTNjN2ZkNjU2MzQxNiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpjYTZkYWQ3NS1iN2YwLTQyNDMtYmI2My00NTNlZDlhZTQwZmQiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTAyLTI0VDE2OjEwOjU2LTA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wNS0wOVQxNDo0NDo0OC0wNzowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wNS0wOVQxNDo0NDo0OC0wNzowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjAyODAxMTc0MDcyMDY4MTE5QkVGRTk2QjI4Q0REOTA4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAyODAxMTc0MDcyMDY4MTE5QkVGRTk2QjI4Q0REOTA4Ii8+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk2NGU5NTk0LWI4ZGYtOWU0Yi1iYWFjLWUwODFkZjE2MDVkNyIgc3RFdnQ6d2hlbj0iMjAxOS0wNS0wOVQxNDo0NDo0OC0wNzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjYTZkYWQ3NS1iN2YwLTQyNDMtYmI2My00NTNlZDlhZTQwZmQiIHN0RXZ0OndoZW49IjIwMTktMDUtMDlUMTQ6NDQ6NDgtMDc6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIi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';
