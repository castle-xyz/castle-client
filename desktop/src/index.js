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
        multiplayerSessions: [
          {
            sessionId: 'MAFFwQTix',
            gameId: '46',
            userIds: [1],
            game: {
              name: 'Light Ryders 🏍',
              name_slug: 'light-ryders',
              description: 'Welcome to The Grid. The GOAL is... to survive!',
              metadata: {
                dimensions: 'full',
                multiplayer: { enabled: true, serverMain: 'src/game_server.lua' },
                main: 'src/main.lua',
              },
              unlisted: false,
              main: 'src/main.lua',
              draft: false,
              last_update_succeeded: true,
              url: 'https://castle.games/+46/@liquidream/light-ryders',
              username: 'liquidream',
              slug: '@liquidream/light-ryders',
              gameId: '46',
              userId: 66,
              createdTime: '2019-04-11T17:59:00.358Z',
              updatedTime: '2019-09-30T22:02:47.529Z',
              coverImageFileId: 16012,
              entryPoint:
                'https://raw.githubusercontent.com/Liquidream/lite-bikez/master/src/main.lua',
              storageId: 'baccb6af-67ab-488c-ae8e-4bfcad8051b6',
              ownerId: 66,
              owner: {
                username: 'liquidream',
                username_lower_case: 'liquidream',
                about: {
                  rich:
                    '{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","leaves":[{"object":"leaf","text":"","marks":[]}]}]}]}}',
                },
                name: 'Paul Nicholas',
                userId: 66,
                createdTime: '2019-02-20T19:00:17.293Z',
                updatedTime: '2019-02-25T05:40:27.124Z',
                websiteUrl: 'https://www.liquidream.co.uk',
                twitterUsername: 'Liquidream',
                itchUsername: 'Liquidream',
                photoFileId: 52,
                isTestUser: false,
              },
              title: 'Light Ryders 🏍',
              serverEntryPoint:
                'https://raw.githubusercontent.com/Liquidream/lite-bikez/master/src/game_server.lua',
              sourceUrl:
                'https://raw.githubusercontent.com/Liquidream/lite-bikez/master/lite-bikez.castle',
              isCastleHosted: false,
              castleUrlPath: '+46/@liquidream/light-ryders',
              chatChannelId: 'game-46',
              coverImage: {
                file_id: 16012,
                url: 'https://d1vkcv80qw9qqp.cloudfront.net/03f6a0a39683a6d59336d8b153da6f93',
                s3_key: '03f6a0a39683a6d59336d8b153da6f93',
                user_id: 66,
                width: 1923,
                height: 1073,
                filename: null,
                mime_type: null,
                encoding: null,
                created_at: '2019-08-17T17:48:08.210Z',
                updated_at: '2019-08-17T17:48:08.210Z',
                imgixUrl: 'https://d1vkcv80qw9qqp.cloudfront.net/03f6a0a39683a6d59336d8b153da6f93',
                fileId: 16012,
              },
              playCount: 10,
              sessionId: 'MAFFwQTix',
              sessionUsers: [
                {
                  userId: 1,
                  username: 'jesse',
                },

                {
                  userId: 2,
                  username: 'charlie',
                },
                {
                  userId: 2,
                  username: 'charlie',
                },
                {
                  userId: 2,
                  username: 'charlie',
                },
                {
                  userId: 2,
                  username: 'charlie',
                },
              ],
            },
          },
        ],
      },
      userStatusHistory: data.userStatusHistory,
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
