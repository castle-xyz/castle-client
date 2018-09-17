import * as React from 'react';
import * as Fixtures from '~/common/fixtures';

import CoreApp from '~/core-components/CoreApp';

// NOTE(jim): The entire initial state of the application can be represented here.
// There is only one JavaScript object at the root that represents local state.
export default () => {
  const state = {
    url: '',
    viewer: null,
    searchQuery: '',
    searchResultsMedia: null,
    searchResultsPlaylists: null,
    sidebarMode: null, // current-playlists | dashboard | media-info | null
    pageMode: null, // browse | playlist | profile | null
    profileMode: null, // media | playlist | null
    isMediaFavorited: false,
    isMediaExpanded: true,
    isOverlayActive: true,
    isScoreVisible: false,
  };

  return <CoreApp state={state} />;
};
