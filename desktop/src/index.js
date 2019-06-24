import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Network from '~/common/network';
import * as Actions from '~/common/actions';
import * as Analytics from '~/common/analytics';

import { injectGlobal } from 'react-emotion';
import { injectGlobalLoaderStyles } from '~/components/primitives/loader';

import ReactDOM from 'react-dom';
import App from './App';
import GLLoaderScreen from '~/isometric/components/GLLoaderScreen';
import Storage from '~/common/storage';

import 'react-tippy/dist/tippy.css';

const injectGlobalStyles = () => injectGlobal`
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
loader.id = 'loader';

document.body.appendChild(loader);

const INITIAL_STATE_OFFLINE = {
  trendingGames: [],
  gamesUnderConstruction: [],
  newestGames: [],
  randomGames: [],
  featuredExamples: [],
  isOffline: true,
};

const run = async () => {
  // initialize analytics
  await Analytics.initialize();
  Analytics.trackCastleLaunch();

  ReactDOM.render(<GLLoaderScreen />, document.getElementById('loader'));
  const {
    trendingGames,
    gamesUnderConstruction,
    newestGames,
    randomGames,
    featuredExamples,
    viewer,
    isOffline,
    recentChatMessages,
    subscribedChatChannels,
    allChatChannels,
  } = await Network.getProductData();

  // if the user was automatically logged in when starting Castle, track that
  if (viewer) {
    Analytics.trackLogin({ user: viewer, isAutoLogin: true });
  }

  let state = Object.assign({}, INITIAL_STATE_OFFLINE, {
    trendingGames,
    gamesUnderConstruction,
    newestGames,
    randomGames,
    featuredExamples,
    isOffline,
    recentChatMessages,
    subscribedChatChannels,
    allChatChannels,
  });

  const notifications = await Actions.getNotificationPreferences();
  state.currentUser = { user: viewer };
  if (state.currentUser.user) {
    state.currentUser = { user: { ...state.currentUser.user, notifications } };
  }

  // NOTE(jim): You must be authenticated to use Castle.
  // https://github.com/castle-games/ghost/issues/480
  state.navigation = viewer ? { contentMode: 'home' } : { contentMode: 'signin' };

  ReactDOM.render(<App state={state} storage={storage} />, document.getElementById('root'));

  document.getElementById('loader').classList.add('loader--finished');

  await Actions.delay(1000);

  ReactDOM.unmountComponentAtNode(document.getElementById('loader'));

  document.getElementById('loader').outerHTML = '';
};

injectGlobalStyles();
injectGlobalScrollOverflowPreventionStyles();
injectGlobalLoaderStyles();
run();
