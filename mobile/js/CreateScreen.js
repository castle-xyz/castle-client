import Expo, {
  FileSystem,
  ImagePicker,
  Permissions,
  LinearGradient,
  MediaLibrary,
  ImageManipulator,
} from 'expo';
import React from 'react';
import {
  ScrollView,
  Text,
  View,
  Image,
  TextInput,
  Slider,
  Keyboard,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  Button as RNButton,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import debounce from 'lodash.debounce';
import tinycolor from 'tinycolor2';
import { FontAwesome } from '@expo/vector-icons';
import firebase from 'react-native-firebase';

import GhostView from './GhostView';
import * as GhostChannels from './GhostChannels';
import * as FileServer from './FileServer';
import ColorPicker from './ColorPicker';
import { Box, Button, BetterIonicons, textInputStyle } from './Components';
import * as Blab from './Blab';
import * as Db from './Db';
import BrowseScreen from './BrowseScreen';
import * as Analytics from './Analytics';

// Listen for `print`s and `error`s from Lua
GhostChannels.on('PRINT', json => console.log('[lua]', ...JSON.parse(json)));
GhostChannels.on('ERROR', json => console.log('[lua]', '[error]', JSON.parse(json).error));

// URI to the built-in Lua code that Ghost should load. In development mode we load directly from
// the React Native packager. In non-development we use a raw GitHub URI to a specific version of
// the code.
const BUILTINS_VERSION = '6eafa754593eb75feb02151d8b084ab0c33703f9';
let BUILTINS_URI;
let SHOW_RELOAD_BUTTON;
if (Expo.Constants.manifest && Expo.Constants.manifest.developer) {
  // Development mode?
  BUILTINS_URI =
    Expo.Constants.manifest.bundleUrl.match(/^https?:\/\/.*?\//)[0] + 'builtins/main.lua';
  SHOW_RELOAD_BUTTON = true;
} else {
  BUILTINS_URI = `https://raw.githubusercontent.com/nikki93/brushy-builtins/${BUILTINS_VERSION}/main.lua`;
  SHOW_RELOAD_BUTTON = false;
}

// The default code brush
const defaultCodeBrushInfo = (async () => {
  const localUri = `${FileSystem.cacheDirectory}defaultCode-${BUILTINS_VERSION}.lua`;
  if (!(await FileSystem.getInfoAsync(localUri)).exists) {
    await FileSystem.downloadAsync(
      BUILTINS_URI.replace(/main\.lua$/, 'brushes/code.lua'),
      localUri
    );
  }
  const blabId = Blab.idForFile(localUri);
  return { localUri, blabId };
})();
export const defaultCodeBrushBlabId = async () => (await defaultCodeBrushInfo).blabId;

// Directory to serve with `FileServer`
const fileServerDirectory = `${FileSystem.documentDirectory}FileServer1`;
const codeBrushFile = fileServerDirectory + '/code.lua';

// 'Post' button that shows feedback of posting progress
class PostButton extends React.Component {
  state = {
    posting: false,
  };

  render() {
    const { posting } = this.state;
    return (
      <RNButton
        title={posting ? 'Posting...' : 'Post'}
        disabled={posting}
        color={posting ? '#666' : undefined}
        onPress={this._onPress.bind(this)}
      />
    );
  }

  async _onPress() {
    const onPost = this.props.navigation.getParam('onPost');
    if (onPost) {
      this.setState({ posting: true });
      try {
        await onPost();
        this.setState({ posting: false });
        Alert.alert(
          'Posted!',
          'Your image was posted! Do you want to continue this painting session or are you done?',
          [
            {
              text: 'Continue',
              onPress: () => {},
              style: 'cancel',
            },
            {
              text: 'Done',
              onPress: () => this.props.navigation.pop(),
            },
          ],
          { cancelable: false }
        );
      } catch (e) {
        this.setState({ posting: false });
        Alert.alert(`Error posting image: ${e.message}`);
      } finally {
      }
    }
  }
}

// Here it is! The actual brushy 'Create' screen!
export default class CreateScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerLeft: <RNButton title="Cancel" onPress={() => navigation.pop()} color="#666" />,
    headerRight: <PostButton navigation={navigation} />,
  });

  state = {
    // Whether to allow user interactions. If `false`, dims the whole screen and makes it
    // unresponsive to input. Useful to temporarily pause interaction when posting, exporting, etc.
    allowInteractions: true,

    // Whether to display the `GhostView` -- used to delay display initially to keep navigation
    // animation smooth
    showGhostView: false,

    // URL the `FileServer` is serving at, set when it's started
    fileServerUrl: null,
    fileServerBonjourUrl: null,

    // Map of brush name -> setting name -> shape for that setting
    settingsShapes: {},

    // Currently selected brush
    selectedBrushName: null,

    // Whether we can redo
    redoAvailable: false,
  };

  constructor(props, context) {
    super(props, context);

    this._subscriptions = [];

    this._initKeyboardAvoidance();

    this._settings = {};
  }

  componentDidMount() {
    this.props.navigation.setParams({ onPost: this._post.bind(this) });
    this._initGhostViewDelay();
    this._initFileServer();
    this._initSettings();
    this._initRedoAvailability();
  }

  componentWillUnmount() {
    this._deinitFileServer();
    this._subscriptions.forEach(subscription => subscription.remove());
    this._subscriptions = [];
  }

  _initGhostViewDelay() {
    // this.props.navigation.addListener('didFocus', () => this.setState({ showGhostView: true }));

    // const timeout = setTimeout(() => this.setState({ showGhostView: true }), 480);
    // this._subscriptions.push({ remove: () => clearTimeout(timeout) });

    this.setState({ showGhostView: true });
  }

  _initFileServer() {
    // Subscribe to `FileServer` events before starting it
    this._subscriptions.push(
      // Save the URL(s)
      FileServer.onStart(({ url }) => {
        this.setState({ fileServerUrl: url });
      }),
      FileServer.onBonjour(({ url }) => {
        this.setState({ fileServerBonjourUrl: url });
      }),

      // Reload on change. Debounce heavily by waiting first, reloading, then also waiting after.
      FileServer.onChange(
        (() => {
          let reloading = false;
          return () => {
            if (!reloading) {
              reloading = true;
              setTimeout(() => {
                this._reloadGhostView();
                setTimeout(() => {
                  reloading = false;
                }, 1500); // Wait after
              }, 400); // Wait before
            }
          };
        })()
      )
    );

    // Make the code directory and copy 'code.lua' (if they don't already exist), then start the
    // `FileServer`.
    (async () => {
      await FileSystem.makeDirectoryAsync(fileServerDirectory, { intermediates: true });
      const codeBlabId = this.props.navigation.getParam('codeBlabId');
      const codeLocalUri = codeBlabId
        ? await Blab.get(codeBlabId)
        : (await defaultCodeBrushInfo).localUri;
      await FileSystem.copyAsync({
        from: codeLocalUri,
        to: codeBrushFile,
      });
      this._loadCodeBrush();
      await FileServer.startAsync({ directory: fileServerDirectory });
    })();
  }

  _deinitFileServer() {
    FileServer.stopAsync();
  }

  _initSettings() {
    // Keep track of settings shape
    this._subscriptions.push(
      GhostChannels.on('SETTINGS_SHAPES', json => {
        const shape = JSON.parse(json);
        this.setState({ settingsShapes: shape }, () => {
          // Migrate to new shape.
          // TODO(nikki): Remove settings whose shape is removed or whose shape's type changed?
          Object.keys(shape).forEach(brushName => {
            Object.keys(shape[brushName]).forEach(settingName => {
              this._setSetting(brushName, settingName);
            });
          });

          // Notify about selected brush -- defaulting to previously selected brush, else the code
          // brush if a custom one was picked, else the line brush
          let toSelect;
          if (this.state.selectedBrushName) {
            toSelect = this.state.selectedBrushName;
          } else {
            if (this.props.navigation.getParam('codeBlabId')) {
              if (shape.code) {
                toSelect = 'code';
              }
            } else {
              if (shape.line) {
                toSelect = 'line';
              }
            }
          }
          this._selectBrush(toSelect);
        });
      })
    );
  }

  _debouncedForceUpdate = debounce(() => this.forceUpdate(), 100);

  _setSetting(brushName, settingName, value) {
    if (!this._settings[brushName]) {
      this._settings[brushName] = {};
    }

    if (value === undefined) {
      value = this._settings[brushName][settingName];
    }
    if (value === undefined) {
      value = this.state.settingsShapes[brushName][settingName].default;
    }
    if (value === undefined) {
      value = null;
    }
    this._settings[brushName][settingName] = value;

    const json = JSON.stringify({ brushName, settingName, value });
    GhostChannels.pushAsync('SETTING_VALUE', json);

    this._debouncedForceUpdate();
  }

  _initKeyboardAvoidance() {
    this._negativeKeyboardHeight = new Animated.Value(0);
    this._trayGradientHeight = new Animated.Value(4);

    this._subscriptions.push(
      Keyboard.addListener('keyboardWillShow', ({ duration, endCoordinates: { height } }) =>
        Animated.parallel([
          Animated.timing(this._negativeKeyboardHeight, { duration, toValue: -height }),
          Animated.timing(this._trayGradientHeight, { duration, toValue: 24 }),
        ]).start()
      ),
      Keyboard.addListener('keyboardWillHide', ({ duration }) =>
        Animated.parallel([
          Animated.timing(this._negativeKeyboardHeight, { duration, toValue: 0 }),
          Animated.timing(this._trayGradientHeight, { duration, toValue: 4 }),
        ]).start()
      )
    );
  }

  _initRedoAvailability() {
    this._subscriptions.push(
      GhostChannels.on('REDO_AVAILABLE', () => this.setState({ redoAvailable: true })),
      GhostChannels.on('REDO_UNAVAILABLE', () => this.setState({ redoAvailable: false }))
    );
  }

  render() {
    const GhostViewOrNot = this.state.showGhostView ? GhostView : View;

    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={{
          flex: 1,
          backgroundColor: 'white',
        }}>
        <LinearGradient colors={['#ddd', 'white']} style={{ padding: 6, paddingBottom: 0 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              <GhostViewOrNot
                ref={ref => (this._ghostView = ref)}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  backgroundColor: 'black',
                }}
                uri={BUILTINS_URI}
              />

              {!this.state.settingsShapes.code ? (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'black',
                  }}>
                  <ActivityIndicator size="large" />
                </View>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </LinearGradient>

        <Animated.View style={{ flex: 1, marginTop: this._negativeKeyboardHeight }}>
          <Animated.View style={{ height: this._trayGradientHeight }}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <View style={{ flex: 1, backgroundColor: 'white', paddingTop: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 4,
                marginHorizontal: 10,
              }}>
              <Button style={{ flex: 1 }} onPress={this._undo.bind(this)}>
                <BetterIonicons name="ios-undo" color="black" />
              </Button>
              <Button
                style={{ flex: 1, marginLeft: 6 }}
                disabled={!this.state.redoAvailable}
                onPress={this._redo.bind(this)}>
                <BetterIonicons
                  name="ios-redo"
                  color={this.state.redoAvailable ? 'black' : '#888'}
                />
              </Button>
              <Button style={{ flex: 1, marginLeft: 6 }} onPress={this._save.bind(this)}>
                <FontAwesome name="download" size={16} color="black" />
              </Button>
              {SHOW_RELOAD_BUTTON ? (
                <Button style={{ flex: 1, marginLeft: 6 }} onPress={this._reloadGhostView}>
                  <Text>reload</Text>
                </Button>
              ) : null}
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 4,
                marginHorizontal: 10,
              }}>
              {Object.keys(this.state.settingsShapes)
                .sort()
                .map((brushName, i) => (
                  <Button
                    key={brushName}
                    style={{
                      flex: 1,
                      marginLeft: i === 0 ? 0 : 6,
                      ...(this.state.selectedBrushName === brushName
                        ? {
                            backgroundColor: '#eee',
                          }
                        : {}),
                    }}
                    onPress={() => this._selectBrush(brushName)}>
                    <Text>{brushName}</Text>
                  </Button>
                ))}
            </View>

            <ScrollView
              ref={ref => (this._settingsScrollView = ref)}
              style={{ flex: 1, marginHorizontal: 10 }}
              contentContainerStyle={{ paddingBottom: 10 }}>
              {this.state.selectedBrushName === 'code' &&
              (this.state.fileServerBonjourUrl || this.state.fileServerUrl) ? (
                <Box>
                  <Text>
                    To edit code:{'\n'}
                    - Connect your macOS and iPhone to the same Wi-Fi network{'\n'}
                    - Hit Cmd + K in Finder and go to{' '}
                    {this.state.fileServerBonjourUrl || this.state.fileServerUrl}
                    {'\n'}
                    - Open 'code.lua' with your favorite text editor
                  </Text>
                </Box>
              ) : null}

              {this.state.selectedBrushName &&
              this.state.settingsShapes[this.state.selectedBrushName]
                ? Object.keys(this.state.settingsShapes[this.state.selectedBrushName])
                    .sort()
                    .map(settingName =>
                      this._renderSettingRow({
                        brushName: this.state.selectedBrushName,
                        settingName,
                        shape: this.state.settingsShapes[this.state.selectedBrushName][settingName],
                        value: this._settings[this.state.selectedBrushName][settingName],
                        onChangeValue: newValue =>
                          this._setSetting(this.state.selectedBrushName, settingName, newValue),
                      })
                    )
                : null}
            </ScrollView>
          </View>
        </Animated.View>

        {!this.state.allowInteractions ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              right: 0,
              backgroundColor: `rgba(0, 0, 0, 0.2)`,
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    );
  }

  _renderSettingRow({ brushName, settingName, shape, ...rest }) {
    const type = shape.type;
    const renderFunc = this['_renderSettingEditor' + type.replace(/^./, c => c.toUpperCase())];
    const editor = renderFunc ? (
      renderFunc.bind(this)({ settingName, shape, ...rest })
    ) : (
      <Text>unsupported</Text>
    );

    return (
      <Box key={`${brushName}:${settingName}`} style={{ flexDirection: 'row' }}>
        <View
          style={{
            flex: 2,
            borderRightWidth: 1,
            borderColor: '#aaa',
            marginRight: 6,
            justifyContent: 'center',
          }}>
          <Text>{settingName}</Text>
        </View>
        <View style={{ flex: 4, alignItems: 'flex-start' }}>{editor}</View>
      </Box>
    );
  }

  _renderSettingEditorImage({ name, value, onChangeValue }) {
    const pick = async method => {
      await new Promise(resolve => this.setState({ allowInteractions: false }, resolve));
      try {
        if ((await Permissions.askAsync(Permissions.CAMERA)).status !== 'granted') {
          Alert.alert(
            `brushy doesn't have Camera access! Please enable in iOS Settings under 'brushy'.`
          );
          return;
        }
        if ((await Permissions.askAsync(Permissions.CAMERA_ROLL)).status !== 'granted') {
          Alert.alert(
            `brushy doesn't have Photos access! Please enable in iOS Settings under 'brushy'.`
          );
          return;
        }

        const { cancelled, uri: localUri } = await ImagePicker[method]();
        if (!cancelled) {
          const manipResult = await ImageManipulator.manipulate(localUri, [], { format: 'jpeg' });
          onChangeValue({ uri: manipResult.uri });
        }
      } finally {
        this.setState({ allowInteractions: true });
      }
    };

    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Button style={{ marginRight: 6 }} onPress={() => pick('launchCameraAsync')}>
          <FontAwesome name="camera" size={16} color="black" />
        </Button>
        <Button style={{ marginRight: 6 }} onPress={() => pick('launchImageLibraryAsync')}>
          <FontAwesome name="picture-o" size={16} color="black" />
        </Button>
        {value ? (
          <Image
            style={{
              alignSelf: 'stretch',
              aspectRatio: 1,
              backgroundColor: 'red',
              borderRadius: 4,
            }}
            source={{ uri: value.uri }}
          />
        ) : null}
      </View>
    );
  }

  _renderSettingEditorText({ value, onChangeValue }) {
    return (
      <TextInput
        style={textInputStyle}
        multiline
        value={value}
        onChangeText={text => onChangeValue(text)}
      />
    );
  }

  _renderSettingEditorNumber({ name, shape, value, onChangeValue }) {
    if (shape.style === 'slider') {
      const minValue = typeof shape.min === 'number' ? shape.min : 0;
      const maxValue = typeof shape.max === 'number' ? shape.max : 1;
      const step = typeof shape.step === 'number' ? shape.step : 0;
      return (
        <Slider
          style={{
            width: '100%',
          }}
          value={value}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          onValueChange={number => onChangeValue(number)}
        />
      );
    } else {
      return (
        <TextInput
          style={textInputStyle}
          keyboardType="decimal-pad"
          onChangeText={text => {
            const float = parseFloat(text);
            onChangeValue(isNaN(float) ? 0 : float);
          }}
        />
      );
    }
  }

  _renderSettingEditorColor({ name, value, onChangeValue }) {
    return (
      <SettingEditorColor
        value={value}
        onSetSetting={newValue => onChangeValue(newValue)}
        onScrollEnable={() => {
          this._settingsScrollView &&
            this._settingsScrollView.setNativeProps({ scrollEnabled: true });
        }}
        onScrollDisable={() => {
          this._settingsScrollView &&
            this._settingsScrollView.setNativeProps({ scrollEnabled: false });
        }}
      />
    );
  }

  _undo() {
    GhostChannels.pushAsync('UNDO', '');
  }

  _redo() {
    GhostChannels.pushAsync('REDO', '');
  }

  _reloadGhostView = async () => {
    // Debounced because a lot of text editors send multiple events when just saving a file
    if (this._ghostView) {
      // Give Lua 0.2 seconds to take care of things before reloading
      const result = await GhostChannels.supplyAsync('RELOAD', '', { timeout: 0.2 });
      this._ghostView.reload();
      this._loadCodeBrush();
    }
  };

  _loadCodeBrush() {
    GhostChannels.pushAsync('LOAD_CODE_BRUSH', codeBrushFile);
  }

  async _export() {
    await GhostChannels.clearAsync('SCREENSHOT_SAVED'); // We want a fresh one
    try {
      await GhostChannels.pushAsync('SCREENSHOT_REQUESTED', '');
      const path = await GhostChannels.demandAsync('SCREENSHOT_SAVED', { timeout: 1 });
      if (path) {
        return 'file://' + encodeURI(path);
      } else {
        return null;
      }
    } finally {
      GhostChannels.clearAsync('SCREENSHOT_REQUESTED'); // In case Lua didn't eat our request
    }
  }

  async _save() {
    await new Promise(resolve => this.setState({ allowInteractions: false }, resolve));
    try {
      if ((await Permissions.askAsync(Permissions.CAMERA_ROLL)).status !== 'granted') {
        Alert.alert(
          `brushy doesn't have Photos access! Please enable in iOS Settings under 'brushy'.`
        );
        return;
      }

      const localUri = await this._export();
      const asset = await MediaLibrary.createAssetAsync(localUri);
      const existingAlbum = await MediaLibrary.getAlbumAsync('brushy');
      if (existingAlbum) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], existingAlbum, false);
      } else {
        await MediaLibrary.createAlbumAsync('brushy', asset, false);
      }

      Alert.alert("Saved to the 'brushy' album in Photos!");
    } finally {
      this.setState({ allowInteractions: true });
    }
  }

  async _post() {
    await new Promise(resolve => this.setState({ allowInteractions: false }, resolve));
    try {
      const localUri = await this._export();
      const manipResult = await ImageManipulator.manipulate(
        localUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: 'jpeg' }
      );
      const [blabId, codeBlabId] = await Promise.all([
        Blab.put(manipResult.uri),
        Blab.put(codeBrushFile),
      ]);
      await Db.posts.add({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        byUid: Db.currentUid(),
        blabId,
        codeBlabId,
      });
      Analytics.newPost();
      BrowseScreen.refresh();
    } finally {
      this.setState({ allowInteractions: true });
    }
  }

  _selectBrush(brushName) {
    if (this.state.settingsShapes[brushName]) {
      this.setState({ selectedBrushName: brushName }, () => {
        GhostChannels.pushAsync('SELECT_BRUSH', brushName);
      });
    }
  }
}

class SettingEditorColor extends React.Component {
  state = {
    picking: false,
  };

  render() {
    const { value, onSetSetting } = this.props;

    const setter = hexString => {
      const rgba = tinycolor(hexString).toRgb();
      onSetSetting({
        r: rgba.r / 255.0,
        g: rgba.g / 255.0,
        b: rgba.b / 255.0,
        a: 1, // rgba.a ? rgba.a / 255.0 : null,
      });
    };

    let oldColorRgbStr;
    if (value) {
      const r255 = 255 * value.r;
      const g255 = 255 * value.g;
      const b255 = 255 * value.b;
      oldColorRgbStr = `rgb(${r255}, ${g255}, ${b255})`;
    }

    let comp;
    if (!this.state.picking) {
      comp = (
        <Button
          style={
            oldColorRgbStr
              ? { backgroundColor: oldColorRgbStr, borderColor: '#ddd', borderWidth: 1 }
              : null
          }
          onPress={() => this.setState({ picking: true })}>
          {oldColorRgbStr ? (
            <Text> </Text>
          ) : (
            <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              <BetterIonicons name="ios-color-palette" color="black" />
            </View>
          )}
        </Button>
      );
    } else {
      comp = (
        <View style={{ ...textInputStyle, width: null, padding: 0, overflow: 'hidden' }}>
          <ColorPicker
            style={{ width: 200, height: 200 }}
            oldColor={oldColorRgbStr}
            onColorChange={debounce(setter, 200)}
            onColorSelected={hexString => {
              setter(hexString);
              this.setState({ picking: false });
            }}
            onOldColorSelected={() => this.setState({ picking: false })}
            onScrollEnable={() => this.props.onScrollEnable && this.props.onScrollEnable()}
            onScrollDisable={() => this.props.onScrollDisable && this.props.onScrollDisable()}
          />
        </View>
      );
    }

    return <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>{comp}</View>;
  }
}
