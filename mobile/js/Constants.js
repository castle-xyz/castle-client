import { Platform } from 'react-native';

export const iOS = Platform.OS === 'ios';
export const Android = Platform.OS === 'android';

export const CARD_RATIO = 5 / 7;
export const CARD_BORDER_RADIUS = 12;
export const CARD_SMALL_BORDER_RADIUS = 6;
export const GRID_PADDING = 8;
export const FEED_HEADER_HEIGHT = 48;
export const FEED_ITEM_HEADER_HEIGHT = 48;

// on tablets, limit some form widths
export const TABLET_MAX_FORM_WIDTH = 512;

export const DISCORD_INVITE_LINK = 'https://discord.gg/rQETB4H';

export const colors = {
  black: '#000',
  tapHighlight: '#111',
  grayText: '#888',
  grayOnWhiteBorder: '#ccc',
  grayOnBlackBorder: '#444',
  white: '#fff',
  skeletonBG: '#262626',
  skeletonText: '#595959',
};

export const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dropShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: iOS ? 1 : undefined,
  },
  dropShadowUp: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: iOS ? 1 : undefined, // TODO: unbreak this for android bottom sheet
  },
  textShadow: {
    textShadowColor: '#0004',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  plainButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  plainButtonLabel: {
    color: '#000',
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButtonIconLeft: {
    marginLeft: -3,
    marginRight: 4,
    marginBottom: -1,
  },
  primaryButtonIconRight: {
    marginRight: -5,
    marginLeft: 6,
    marginBottom: -1,
  },
  secondaryButton: {
    borderRadius: 6,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 12,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  secondaryButtonIconLeft: {
    marginLeft: -5,
    marginRight: 6,
    marginBottom: -1,
  },
  buttonLarge: {
    paddingTop: 10,
    paddingBottom: 10,
    width: 250,
  },
  buttonLargeLabel: {
    fontSize: 20,
  },
  paneHandle: {
    width: 50,
    alignSelf: 'center',
    paddingTop: 4,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  gridItem: {
    paddingRight: GRID_PADDING,
    paddingBottom: GRID_PADDING,
  },
  textInputOnWhite: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: 4,
    color: '#000',
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
  },
  textInputLabelOnWhite: {
    fontSize: 16,
    marginBottom: 6,
  },
  buttonOnWhite: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  buttonLabelOnWhite: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  siteHeaderButton: {
    position: 'absolute',
    right: 16,
    bottom: 12,
  },
  siteHeaderIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 16,
  },
  empty: {
    width: '100%',
    padding: 16,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    color: colors.grayText,
    fontSize: 20,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.grayText,
    fontSize: 16,
    lineHeight: 24,
  },
  floatingActionButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: iOS ? 1 : undefined,
  },
};

export const EMPTY_CARD = {
  title: '',
  blocks: [],
  scene: {
    sceneId: Math.floor(Math.random() * 100000),
    data: { empty: true },
  },
};

export const EMPTY_DECK = {
  title: '',
  cards: [],
  variables: [],
};

export const FEED_ITEM_DECK_FRAGMENT = `
  id
  deckId
  title
  visibility
  creator {
    userId
    username
    photo {
      url
    }
  }
  childDecksCount
  parentDeckId
  parentDeck {
    deckId
    creator { username }
  }
  initialCard {
    id
    cardId
    title
    backgroundColor
    backgroundImage {
      url
      smallUrl
    }
  }
  previewVideo {
    url
    firstFrameImage { url, smallUrl }
  }
  reactions {
    id
    reactionId
    count
    isCurrentUserToggled
  }
  comments {
    threadId
    count
  }
  commentsEnabled
  lastModified
  variables
`;

export const USER_PROFILE_FRAGMENT = `
  id
  userId
  name
  username
  email
  websiteUrl
  twitterUsername
  itchUsername
  photo {
    url
  }
  badges {
    label
    image { url }
  }
  connections
  followersCount
  connectionsYouKnow {
    id
    userId
    username
    photo { url }
  }
  decks {
    ${FEED_ITEM_DECK_FRAGMENT}
  }
  isReactNativeChannelsEnabled
`;

export const COMMENT_FRAGMENT = `
  commentId
  fromUser {
    userId
    username
    photo { url }
  }
  body
  isDeleted
  createdTime
`;

export const COMMENTS_LIST_FRAGMENT = `
  threadId
  count
  comments {
    ${COMMENT_FRAGMENT}
    childComments {
      threadId
      count
      comments { ${COMMENT_FRAGMENT} }
    }
  }
`;

export const reactionIds = {
  fire: 'fire',
};
