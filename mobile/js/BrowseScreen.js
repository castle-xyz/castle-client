import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';
import moment from 'moment';
import { EventEmitter } from 'fbemitter';
import { FontAwesome } from '@expo/vector-icons';

import * as Blab from './Blab';
import { Box, Button } from './Components';
import * as Db from './Db';
import * as CreateScreen from './CreateScreen';
import * as Analytics from './Analytics';

const dateBefore = date => new Date(date.getTime() - 1);

// Show a post!
class PostView extends React.PureComponent {
  state = {
    localUri: null,

    details: null,
    showDetails: false,

    canUseCode: false,
  };

  constructor(props, context) {
    super(props, context);

    // Initialize `Animated` values
    this._detailsOpacity = new Animated.Value(0);

    // `PanResponder` that keeps track of whether we're being touched so that we don't dismiss the
    // details overlay while being scrolled
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,

      onPanResponderGrant: (evt, gestureState) => {
        // We're gesturing! Also the gesture isn't terminated yet...
        this._gesturing = true;
        this._gestureTerminated = false;

        // Clear a leftover delayed 'release' event
        if (this._releaseTimeout) {
          clearTimeout(this._releaseTimeout);
        }
      },
      onPanResponderMove: (evt, gestureState) => {},
      onPanResponderRelease: (evt, gestureState) => {
        // If the gesture wasn't terminated + we didn't just finish scrolling, we were touched
        // like a button. Show details!
        if (!this._gestureTerminated && !this._scrolling) {
          this._toggleShowDetails();
        }

        // Register the touch as released after a short delay to keep details visible during
        // scroll deceleration
        if (this._releaseTimeout) {
          clearTimeout(this._releaseTimeout);
        }
        this._releaseTimeout = setTimeout(() => {
          this._gesturing = false;
          this._releaseTimeout = null;
        }, 420);
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true; // Not sure if this is necessary...
      },
      onPanResponderTerminationRequest: (evt, gestureState) => {
        // Block gesture termination but register as terminated so we still get 'release' events
        this._gestureTerminated = true;
        return false;
      },
    });
  }

  componentDidMount() {
    // Fetch the blab
    (async () => {
      this.setState({ localUri: await Blab.get(this.props.snapshot.data().blabId) });
    })();

    // Check if the code is usable
    (async () => {
      const codeBlabId = this.props.snapshot.data().codeBlabId;
      if (codeBlabId && codeBlabId !== (await CreateScreen.defaultCodeBrushBlabId())) {
        this.setState({ canUseCode: true });
      }
    })();
  }

  render() {
    return (
      <Box>
        <View {...this._panResponder.panHandlers}>
          {this.state.localUri ? (
            <Image style={{ aspectRatio: 1, width: null }} source={{ uri: this.state.localUri }} />
          ) : (
            <View style={{ aspectRatio: 1, width: null, backgroundColor: '#eee' }} />
          )}

          {this.state.showDetails ? (
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                right: 0,
                padding: 24,
                backgroundColor: 'white',
                opacity: this._detailsOpacity,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {this.state.details ? (
                <TouchableOpacity onPress={this._gotoBy.bind(this)}>
                  <Text style={{ marginBottom: 12 }}>
                    by{' '}
                    <Text style={{ fontWeight: '900' }}>
                      {this.state.details.byUsername || '(unknown)'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              ) : null}

              <Text>{moment(this.props.snapshot.data().timestamp).fromNow()}</Text>

              {this.state.canUseCode ? (
                <Button style={{ marginTop: 24 }} onPress={this._useCode.bind(this)}>
                  <FontAwesome name="paint-brush" size={25} color="black" />
                </Button>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      </Box>
    );
  }

  _toggleShowDetails = debounce(
    async () => {
      if (!this.state.showDetails) {
        // Asynchronously fetch details if we don't have them yet
        if (!this.state.details) {
          this._fetchDetails();
        }

        // Fade in
        this.setState({ showDetails: true }, () => {
          Animated.timing(this._detailsOpacity, { duration: 90, toValue: 0.88 }).start();
        });

        // Toggle out on scroll
        this._scrollSubscription = this.props.eventEmitter.addListener('scroll', () => {
          // Don't toggle out if we're being touched (assume the user cares about us)
          if (!this._gesturing) {
            this._toggleShowDetails();
          }

          // Keep track of scrolling state with a slight delay on scroll end
          this._scrolling = true;
          if (this._scrollingTimeout) {
            clearTimeout(this._scrollingTimeout);
          }
          this._scrollingTimeout = setTimeout(() => {
            this._scrolling = false;
            this._scrollingTimeout = null;
          }, 200);
        });
      } else {
        // We don't care about scrolls anymore
        this._scrollSubscription.remove();

        // Fade out
        Animated.timing(this._detailsOpacity, { duration: 160, toValue: 0 }).start(() => {
          this.setState({ showDetails: false });
        });
      }
    },
    200,
    { leading: true, trailing: false }
  );

  async _fetchDetails() {
    // Make sure we have an associated `byUid` (old posts don't have one)
    const byUid = this.props.snapshot.data().byUid;
    if (!byUid) {
      this.setState({
        details: {
          byUid: null,
          byUsername: null,
        },
      });
      return;
    }

    const byProfile = await Db.profiles.doc(byUid).get();
    this.setState({
      details: {
        byUid,
        byUsername: byProfile.data().username || null,
      },
    });
  }

  _useCode() {
    const codeBlabId = this.props.snapshot.data().codeBlabId;
    this.props.navigation.navigate('CreateScreen', { codeBlabId });
    Analytics.useCodeBrush({ codeBlabId });
  }

  _gotoBy() {
    // Only navigate if we're not already on a "By" screen for this user
    if (this.state.details.byUid !== this.props.navigation.getParam('byUid')) {
      this.props.navigation.push('BrowseScreen', {
        byUid: this.state.details.byUid,
        byUsername: this.state.details.byUsername,
      });
      Analytics.browseUser();
    }
  }
}

// Live feed of all posts!
const PAGE_SIZE = 5;
const BOTTOM_PADDING = Dimensions.get('window').height * 1.2;
export default class BrowseScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const byUsername = navigation.getParam('byUsername');
    if (byUsername) {
      return { title: `By ${byUsername}` };
    }
    return { title: `Browse` };
  };

  state = {
    postSnapshots: [],
    fetchingNewerPosts: false,
  };

  static instances = []; // Currently mounted instances

  constructor(props, context) {
    super(props, context);

    this._eventEmitter = new EventEmitter();
  }

  componentDidMount() {
    BrowseScreen.instances.push(this);

    this._fetchNewerPosts();
  }

  componentWillUnmount() {
    BrowseScreen.instances = BrowseScreen.instances.filter(instance => instance !== this);
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <ScrollView
          style={{ flex: 1, padding: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={this.state.fetchingNewerPosts}
              onRefresh={this._fetchNewerPosts.bind(this)}
            />
          }
          onScroll={this._onScroll.bind(this)}
          scrollEventThrottle={400}>
          {this.state.postSnapshots.map(snapshot => (
            <PostView
              key={snapshot.id}
              eventEmitter={this._eventEmitter}
              navigation={this.props.navigation}
              snapshot={snapshot}
            />
          ))}
          <View style={{ height: BOTTOM_PADDING }} />
        </ScrollView>
      </View>
    );
  }

  _onScroll({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) {
    this._eventEmitter.emit('scroll');

    if (1.7 * layoutMeasurement.height + contentOffset.y + BOTTOM_PADDING >= contentSize.height) {
      this._fetchOlderPosts();
    }
  }

  async _fetchNewerPosts() {
    // Don't do this too much
    if (this.state.fetchingNewerPosts) {
      return;
    }
    this.setState({ fetchingNewerPosts: true });

    // Do we have a top post already?
    const top = (this.state.postSnapshots && this.state.postSnapshots[0]) || null;

    // Get posts, ending at current top or maxing out at limit, whichever happens first
    let query = this._queryPosts().orderBy('timestamp', 'desc');
    if (top) {
      query = query.endAt(dateBefore(top.data().timestamp));
    }
    query = query.limit(PAGE_SIZE);
    const snapshot = await query.get();

    // If the current top post is in the snapshot, prepend the results, else replace
    const topIndex = top && snapshot.docs.findIndex(({ id }) => id === top.id);
    if (topIndex !== null && topIndex >= 0) {
      this.setState({
        postSnapshots: snapshot.docs.slice(0, topIndex).concat(this.state.postSnapshots),
        fetchingNewerPosts: false,
      });
    } else {
      this.setState({
        postSnapshots: snapshot.docs,
        fetchingNewerPosts: false,
      });
    }
  }

  _fetchOlderPosts = throttle(
    async () => {
      // We need a bottom post
      if (!this.state.postSnapshots || this.state.postSnapshots.length === 0) {
        return;
      }
      const bottom = this.state.postSnapshots[this.state.postSnapshots.length - 1];

      // Don't do this too much
      if (this._fetchingOlderPosts) {
        return;
      }
      this._fetchingOlderPosts = true;

      // Get posts older than current bottom and append
      const query = this._queryPosts()
        .orderBy('timestamp', 'desc')
        .startAfter(bottom)
        .limit(PAGE_SIZE);
      const snapshot = await query.get();
      let toAppend = snapshot.docs;
      const bottomIndex = toAppend.findIndex(({ id }) => id === bottom.id);
      if (bottomIndex >= 0) {
        toAppend = toAppend.slice(bottomIndex + 1);
      }
      this.setState(
        { postSnapshots: this.state.postSnapshots.concat(toAppend) },
        () => (this._fetchingOlderPosts = false)
      );
    },
    800,
    { trailing: false }
  );

  _queryPosts() {
    let query = Db.posts;
    const byUid = this.props.navigation.getParam('byUid');
    if (byUid) {
      query = query.where('byUid', '==', byUid);
    }
    return query;
  }

  static refresh() {
    BrowseScreen.instances.forEach(instance => instance._fetchNewerPosts());
  }
}
