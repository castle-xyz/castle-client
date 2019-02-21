import ReactDOM from 'react-dom';

import * as React from 'react';
import * as Constants from '~/common/constants';
import { NavigationContextDefaults } from '~/contexts/NavigationContext';
import { NavigatorContextDefaults } from '~/contexts/NavigatorContext';
import { SocialContextDefaults } from '~/contexts/SocialContext';
import * as Network from '~/common/network';
import * as Actions from '~/common/actions';

import App from './App';

import Storage from '~/common/storage';

import { LOADER_STRING, injectGlobalLoaderStyles } from '~/components/primitives/loader';
import { injectGlobal } from 'react-emotion';

const injectGlobalStyles = () => injectGlobal`
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
    background: ${Constants.colors.black};
    font-size: 16px;
  }
`;

const injectGlobalScrollOverflowPreventionStyles = () => injectGlobal`
  html {
    overflow: hidden;
  }
  
  body {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const storage = new Storage('castle');

const loader = document.createElement('div');
loader.innerHTML = LOADER_STRING.trim();
loader.id = 'loader';

document.body.appendChild(loader);

const INITIAL_STATE_OFFLINE = {
  allContent: {
    games: [],
    users: [],
  },
  featuredGames: [],
  isOffline: true,
  navigation: NavigationContextDefaults,
  navigator: NavigatorContextDefaults,
  social: SocialContextDefaults,
};

const run = async () => {
  const { allContent, featuredGames, viewer, isOffline } = await Network.getProductData();

  await Actions.delay(300);

  document.getElementById('loader').classList.add('loader--finished');

  let state = Object.assign({}, INITIAL_STATE_OFFLINE, {
    allContent,
    featuredGames,
    isOffline,
  });

  state.currentUser = { user: viewer };
  state.navigation.contentMode = isOffline ? 'game' : 'home';

  ReactDOM.render(<App state={state} storage={storage} />, document.getElementById('root'));

  await Actions.delay(300);

  document.getElementById('loader').outerHTML = '';
};

injectGlobalStyles();
injectGlobalLoaderStyles();
injectGlobalScrollOverflowPreventionStyles();
run();
