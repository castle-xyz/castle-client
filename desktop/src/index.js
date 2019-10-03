import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Analytics from '~/common/analytics';

import { injectGlobalStyles, injectGlobalScrollOverflowPreventionStyles } from './globalStyles';
import { injectGlobalLoaderStyles } from '~/components/primitives/loader';

import ReactDOM from 'react-dom';
import App from './App';
import GLLoaderScreen from '~/isometric/components/GLLoaderScreen';
import Storage from '~/common/storage';

import 'react-tippy/dist/tippy.css';

const storage = new Storage('castle');

const loader = document.createElement('div');
loader.id = 'loader';

document.body.appendChild(loader);

const mountLoader = () => {
  ReactDOM.render(<GLLoaderScreen />, document.getElementById('loader'));
};

const unmountLoader = async () => {
  document.getElementById('loader').classList.add('loader--finished');
  await Actions.delay(1000);
  ReactDOM.unmountComponentAtNode(document.getElementById('loader'));
  document.getElementById('loader').outerHTML = '';
};

const getInitialState = async () => {
  let data;
  let featuredExamples = [];
  let currentUser = {};
  let isOffline = true;

  try {
    data = await Actions.getInitialData();
  } catch (e) {
    console.log(`Issue fetching initial Castle data: ${e}`);
  }

  if (data) {
    isOffline = false;
    featuredExamples = data.featuredExamples ? data.featuredExamples : [];
    currentUser = {
      user: data.me,
      settings: {
        notifications: data.getNotificationPreferences,
      },
      content: {
        trendingGames: data.trendingGames ? data.trendingGames : [],
        multiplayerSessions: [],
      },
      userStatusHistory: data.userStatusHistory,
      appNotifications: data.appNotifications,
    };
  }

  return {
    featuredExamples,
    currentUser,
    isOffline,
    navigation: {},
  };
};

const run = async () => {
  // initialize analytics
  await Analytics.initialize();
  Analytics.trackCastleLaunch();

  mountLoader();
  let state = await getInitialState();

  // if the user was automatically logged in when starting Castle, track that
  if (state.currentUser && state.currentUser.user) {
    Analytics.trackLogin({ user: state.currentUser.user, isAutoLogin: true });
  }

  ReactDOM.render(<App state={state} storage={storage} />, document.getElementById('root'));
  await unmountLoader();
};

injectGlobalStyles();
injectGlobalScrollOverflowPreventionStyles();
injectGlobalLoaderStyles();
run();
