import * as Constants from '~/common/constants';

import { injectGlobal } from 'react-emotion';

export const injectGlobalStyles = () => injectGlobal`
  @font-face {
    font-family: 'game-heading';
    src: url('static/Font-Logo-RTAliasBold.woff');
  }
  @font-face {
    font-family: 'logo-heading';
    src: url('static/Font-Logo2-RTAliasMedium.woff');
  }
  @font-face {
    font-family: 'sf-heading';
    src: url('static/Font-Headings-SFDisplay.woff');
  }
  @font-face {
    font-family: 'sf-body';
    src: url('static/Font-Body-SFDisplay.woff');
  }
  @font-face {
    font-family: 'sf-mono';
    src: url('static/Font-Mono-SFMono.woff');
  }
  @font-face {
    font-family: 'sf-mono-bold';
    src: url('static/SFMono-Bold.woff');
  }
  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, ol, ul, li,
  fieldset, form, label, legend,
  table, caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed,
  figure, figcaption, footer, header, hgroup,
  menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    vertical-align: baseline;
  }

  article, aside, details, figcaption, figure,
  footer, header, hgroup, menu, nav, section {
    display: block;
  }

  html, body {
    font-family: ${Constants.font.default};
    background: ${Constants.colors.white};
    font-size: 16px;
  }
`;

export const injectGlobalScrollOverflowPreventionStyles = () => injectGlobal`
  html {
    overflow: hidden;
  }

  body {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
`;
