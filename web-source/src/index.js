import ReactDOM from 'react-dom';

import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Actions from '~/common/actions';

import App from './App';

import Storage from '~/common/storage';

import { injectGlobal } from 'react-emotion';

const injectGlobalStyles = () => injectGlobal`
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

    @media (max-width: 728px) {
      font-size: 14px;
    }
  }

  #loader {
    background: ${Constants.colors.black};
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 1;
    transition: 200ms ease all;
  }

  #loader.loader--finished {
    opacity: 0;
    pointer-events: none;
  }

  @keyframes loader {
    to {
      transform: rotateY(0deg);
      opacity: 1;
    }
  }

  .loader svg:nth-child(2){
    animation-delay:0.4s;
  }
  .loader svg:nth-child(3){
    animation-delay:0.8s;
  }
  .loader svg:nth-child(4){
    animation-delay:1.0s;
  }
  .loader svg:nth-child(5){
    animation-delay:1.4s;
  }

  .loader svg {
    color: ${Constants.colors.white};
    margin-left: 1px;
    display: inline-block;
    opacity: 0;
    transform: rotateY(360deg);
    animation: loader 1.4s ease-in-out infinite alternate;
  }
`;

const storage = new Storage('castle');
const delay = ms =>
  new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });

const run = async () => {
  const { allMedia = [], allPlaylists = [], me } = await Actions.getInitialData();
  await delay(300);

  document.getElementById('loader').classList.add('loader--finished');

  const state = {
    logs: [],
    mediaUrl: '',
    playlist: null,
    media: null,
    creator: null,
    viewer: me,
    local: null,
    searchQuery: '',
    allMedia,
    allPlaylists,
    allMediaFiltered: [...allMedia],
    allPlaylistsFiltered: [...allPlaylists],
    sidebarMode: null, // current-context | dashboard | media-info | null
    pageMode: 'browse', // browse | playlist | profile | sign-in | null
    profileMode: null, // media | playlist | null
    isMediaFavorited: false,
    isMediaExpanded: false,
    isOverlayActive: true,
  };

  ReactDOM.render(<App state={state} storage={storage} />, document.getElementById('root'));

  await delay(300);

  document.getElementById('loader').outerHTML = '';
};

injectGlobalStyles();
run();
