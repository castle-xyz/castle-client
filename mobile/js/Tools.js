import React, { useState, useRef, useContext, Fragment } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Switch,
  Easing,
  Alert,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Slider from '@react-native-community/slider';
import Markdown from 'react-native-markdown-renderer';
import Popover from 'react-native-popover-view';
import tinycolor from 'tinycolor2';
import FastImage from 'react-native-fast-image';
import FitImage from 'react-native-fit-image';
import { Base64 } from 'js-base64';
import ImagePicker from 'react-native-image-picker';
import { ReactNativeFile } from 'apollo-upload-client';
import gql from 'graphql-tag';
import SvgImage from 'react-native-remote-svg';

import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Zocial from 'react-native-vector-icons/Zocial';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

import { useCardCreator } from './scenecreator/CreateCardContext';
import { sendAsync, useListen } from './ghost/GhostEvents';
import { ScrollView } from 'react-native-gesture-handler';
import * as Constants from './Constants';
import ColorPicker from './scenecreator/inspector/components/ColorPicker';
import * as Session from './Session';
import * as SceneCreatorConstants from './scenecreator/SceneCreatorConstants';

let Colors = SceneCreatorConstants.Colors;

//
// Infrastructure
//

// Lua CJSON encodes sparse arrays as objects with stringified keys, use this to convert back
export const objectToArray = (input) => {
  if (Array.isArray(input)) {
    return input;
  }

  const output = [];
  let i = '0' in input ? 0 : 1;
  for (;;) {
    const strI = i.toString();
    if (!(strI in input)) {
      break;
    }
    output.push(input[strI]);
    ++i;
  }
  return output;
};

// For sending tool events back from JS to Lua (eg. value changes)
let nextEventId = 1;
const sendEvent = (pathId, event) => {
  const eventId = nextEventId++;
  sendAsync('CASTLE_TOOL_EVENT', { pathId, event: { ...event, eventId } });
  return eventId;
};

// Map of element type name (as Lua will refer to an element type by) -> component class
const elementTypes = {};

export const registerElement = (type, component) => {
  elementTypes[type] = component;
};

// Abstract component that reads `element.type` and uses that to instantiate a concrete component
const Tool = React.memo(({ element }) => {
  const ElemType = elementTypes[element.type];
  if (!ElemType) {
    return (
      <View style={{ backgroundColor: '#f5dccb', margin: 4, padding: 8, borderRadius: 6 }}>
        <Text style={{ color: '#85000b' }}>{`\`ui.${element.type}\` not registered`}</Text>
      </View>
    );
  }
  return <ElemType element={{ ...element, props: element.props || {} }} />;
});

// Context for common data across all tools
export const ToolsContext = React.createContext({
  transformAssetUri: (uri) => uri,
  paneName: 'DEFAULT',
  hideLabels: false,
  popoverPlacement: 'auto',
});

// Get an ordered array of the children of an element
const orderedChildren = (element) => {
  if (!element.children) {
    return [];
  }
  if (element.children.count === 0) {
    return [];
  }
  const result = [];
  let id = element.children.lastId;
  while (id !== undefined && id !== null) {
    const child = element.children[id];
    if (!child) {
      break; // This shouldn't really happen...
    }
    result.push({ id, child });
    id = element.children[id].prevId;
  }
  return result.reverse();
};

// Render the children of an element
const renderChildren = (element) =>
  orderedChildren(element).map(({ id, child }) => <Tool key={id} element={child} />);

// Maintain state for a `value` / `onChange` combination. Returns the current value and a setter for the new value
// that can be invoked in a JS change event (which will then propagate the new value back to Lua). The default prop
// and event names are 'value' and 'onChange' respectively but other ones can be provided.
export const useValue = ({ element, propName = 'value', eventName = 'onChange', onNewValue }) => {
  const [lastSentEventId, setLastSentEventId] = useState(null);
  const [value, setValue] = useState(null);

  // Prop changed?
  if (value !== element.props[propName]) {
    // Only apply change if Lua says that it reported our last sent event, otherwise we may overwrite a more
    // up-to-date value that we're storing (eg. new key presses in a text input before the game's value is updated)
    if (lastSentEventId === null || element.lastReportedEventId === lastSentEventId) {
      const newValue = element.props[propName];
      setValue(newValue);
      if (onNewValue) {
        onNewValue(newValue);
      }
    }
  }

  const setValueAndSendEvent = (newValue) => {
    setValue(newValue);
    setLastSentEventId(
      sendEvent(element.pathId, {
        type: eventName,
        [propName]: newValue,
      })
    );
  };

  return [value, setValueAndSendEvent];
};

// Select the `View` style and layout props from `p`
const VIEW_STYLE_PROPS = {
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  aspectRatio: true,
  borderBottomWidth: true,
  borderEndWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderStartWidth: true,
  borderTopWidth: true,
  borderWidth: true,
  bottom: true,
  direction: true,
  display: true,
  end: true,
  flex: true,
  flexBasis: true,
  flexDirection: true,
  flexGrow: true,
  flexShrink: true,
  flexWrap: true,
  height: true,
  justifyContent: true,
  left: true,
  margin: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  maxHeight: true,
  maxWidth: true,
  minHeight: true,
  minWidth: true,
  overflow: true,
  padding: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  right: true,
  start: true,
  top: true,
  width: true,
  zIndex: true,
  borderRightColor: true,
  backfaceVisibility: true,
  borderBottomColor: true,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderBottomWidth: true,
  borderColor: true,
  borderEndColor: true,
  borderLeftColor: true,
  borderLeftWidth: true,
  borderRadius: true,
  backgroundColor: true,
  borderRightWidth: true,
  borderStartColor: true,
  borderStyle: true,
  borderTopColor: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  borderTopWidth: true,
  borderWidth: true,
  opacity: true,
};
const viewStyleProps = (p) => {
  if (!p) {
    return {};
  }
  const r = {};
  Object.keys(p).forEach((k) => {
    if (VIEW_STYLE_PROPS[k]) {
      r[k] = p[k];
    }
  });
  return r;
};

// Render a pane with default values for the context. Each pane tends to have its own styling, so also takes
// a `style` prop.
const ToolPane = React.memo(({ element, style }) => {
  if (!element || !element.props) return null;
  const context = useCardCreator();
  return (
    <ToolsContext.Provider value={{ ...context, paneName: element.props.name }}>
      <View style={[style, viewStyleProps(element.props)]}>{renderChildren(element)}</View>
    </ToolsContext.Provider>
  );
});

// Render a label along with a control
export const Labelled = ({ element, label, style, children }) => {
  const { hideLabels } = useContext(ToolsContext);

  return (
    <View style={{ margin: 4, ...style }}>
      {!(element.props.hideLabel || hideLabels) ? (
        <Text style={{ color: Colors.text, marginBottom: 4 }}>
          {label !== undefined && label !== null ? label : element.props.label}
        </Text>
      ) : null}
      {children}
    </View>
  );
};

//
// Components
//

const textInputStyle = {
  flex: 1,
  color: Colors.textInput.text,
  backgroundColor: Colors.textInput.background,
  borderColor: Colors.textInput.border,
  borderWidth: 1,
  borderRadius: 4,
  paddingVertical: 8,
  paddingHorizontal: 12,
};

const buttonStyle = ({ selected = false } = {}) => ({
  padding: 4,
  borderWidth: 2,
  backgroundColor: selected ? Colors.button.selected : Colors.button.default,
  borderColor: Colors.button.default,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 6,
  overflow: 'hidden',
});

const BasePopover = (props) => {
  const { popoverPlacement } = useContext(ToolsContext);

  return (
    <Popover
      placement={popoverPlacement}
      popoverStyle={{
        backgroundColor: Colors.popover.background,
        borderRadius: 8,
        elevation: 4,
        shadowColor: Colors.popover.shadow,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        overflow: 'visible',
      }}
      animationConfig={{ duration: 80, easing: Easing.inOut(Easing.quad) }}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      {...props}
    />
  );
};

const boldWeight1 = '700';
const boldWeight2 = Constants.iOS ? '900' : '700';

const ToolTextInput = ({ element, multiline }) => {
  const [value, setValue] = useValue({ element });

  multiline = typeof multiline === 'boolean' ? multiline : element.props.multiline;

  return (
    <Labelled element={element}>
      <TextInput
        style={{
          ...textInputStyle,
          height: multiline ? 72 : null,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        returnKeyType={multiline ? null : 'done'}
        multiline={multiline}
        value={value}
        onChangeText={(newText) => setValue(newText)}
      />
    </Labelled>
  );
};
elementTypes['textInput'] = ToolTextInput;

const ToolTextArea = ({ element }) => <ToolTextInput element={element} multiline />;
elementTypes['textArea'] = ToolTextArea;

const BASE_SVG_SIZE = 300.0;

const SvgFit = ({ style, uri }) => {
  // Need to render SVGs at a base size then scale down (or up)

  const [size, setSize] = useState({ width: BASE_SVG_SIZE, height: BASE_SVG_SIZE });

  const onLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }) => setSize({ width, height });

  const scale = Math.min(
    (size.width || BASE_SVG_SIZE) / BASE_SVG_SIZE,
    (size.height || BASE_SVG_SIZE) / BASE_SVG_SIZE
  );

  return (
    <View style={{ ...style, justifyContent: 'center', alignItems: 'center' }} onLayout={onLayout}>
      <View
        style={{
          width: BASE_SVG_SIZE,
          height: BASE_SVG_SIZE,
          transform: [{ scaleX: scale }, { scaleY: scale }],
        }}>
        <SvgImage
          style={{
            width: '100%',
            height: '100%',
          }}
          source={{ uri }}
        />
      </View>
    </View>
  );
};

export const ToolImage = ({ element, path, style, context }) => {
  let { transformAssetUri } = useContext(ToolsContext);
  if (context) {
    transformAssetUri = context.transformAssetUri;
  }

  let resizeMode = FastImage.resizeMode.contain;
  if (element.props?.resizeMode) {
    resizeMode = FastImage.resizeMode[element.props.resizeMode] || resizeMode;
  }

  let uri = path || element.props?.path || '';

  if (!uri.startsWith('file://')) {
    uri = transformAssetUri(uri);
  }

  style = { margin: 4, ...style, ...viewStyleProps(element.props) };

  if (uri.endsWith('.svg')) {
    return <SvgFit style={style} uri={uri} />;
  }
  return <FastImage style={style} source={{ uri }} resizeMode={resizeMode} />;
};
elementTypes['image'] = ToolImage;

const iconFamilies = {
  AntDesign: AntDesign,
  Entypo: Entypo,
  EvilIcons: EvilIcons,
  Feather: Feather,
  FontAwesome: FontAwesome,
  FontAwesome5: FontAwesome5,
  Fontisto: Fontisto,
  Foundation: Foundation,
  Ionicons: Ionicons,
  MaterialIcons: MaterialIcons,
  MaterialCommunityIcons: MaterialCommunityIcons,
  Octicons: Octicons,
  Zocial: Zocial,
  SimpleLineIcons: SimpleLineIcons,
};

const BaseButton = ({ element, selected, style, onPress }) => {
  const baseStyle = buttonStyle({ selected: selected || element.props.selected });

  const { paneName, inPopover } = useContext(ToolsContext);

  const hideLabel =
    element.props.hideLabel !== undefined ? element.props.hideLabel : element.props.iconFill;

  return (
    <TouchableOpacity
      style={{
        ...baseStyle,
        padding: element.props.iconFill ? 0 : baseStyle.padding,
        margin: 4,
        flexDirection: 'row',
        ...style,
        ...viewStyleProps(element.props),
      }}
      onPress={() => {
        sendEvent(element.pathId, { type: 'onClick' });
        if (onPress) {
          onPress();
        }
      }}>
      {element.props.iconFamily ? (
        React.createElement(iconFamilies[element.props.iconFamily], {
          name: element.props.icon,
          ...{
            size: 18,
            color: Colors.text,
            style: {
              margin: 0,
              marginRight: !hideLabel ? 5 : 0,
              height: 18,
              textAlign: 'center',
            },
          },
        })
      ) : element.props.icon ? (
        <ToolImage
          element={element}
          path={element.props.icon}
          style={{
            margin: 0,
            ...(element.props.iconFill
              ? {
                  aspectRatio: 1,
                  alignSelf: 'stretch',
                  width: null,
                  height: null,
                }
              : {
                  width: 18,
                  height: 18,
                }),
            marginRight: !hideLabel ? 6 : 0,
            ...element.props.iconStyle,
          }}
        />
      ) : null}
      {!hideLabel ? (
        <Text style={{ color: Colors.button.text, ...element.props.textStyle }}>
          {element.props.label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const PopoverButton = ({ element }) => {
  const [popoverVisible, setPopoverVisible] = useState(false);

  if (popoverVisible && element.closePopover) {
    setPopoverVisible(false);
  }

  const anchorRef = useRef(null);

  const context = useContext(ToolsContext);

  return (
    <Fragment>
      <View ref={anchorRef} renderToHardwareTextureAndroid style={{ flexDirection: 'row' }}>
        <BaseButton
          element={element}
          selected={popoverVisible}
          onPress={() => {
            if (element.props.popoverAllowed !== false) {
              setPopoverVisible(true);
            }
          }}
        />
      </View>
      <BasePopover
        fromView={anchorRef.current}
        isVisible={popoverVisible}
        onRequestClose={() => setPopoverVisible(false)}>
        <ToolsContext.Provider value={{ ...context, inPopover: true, hideLabels: false }}>
          <View style={{ width: 300, padding: 6, ...element.props.popoverStyle }}>
            {renderChildren(element)}
          </View>
        </ToolsContext.Provider>
      </BasePopover>
    </Fragment>
  );
};

const ToolButton = ({ element }) => {
  if (element.props.enablePopover) {
    return <PopoverButton element={element} />;
  } else {
    return <BaseButton element={element} />;
  }
};
elementTypes['button'] = ToolButton;

const ToolBox = ({ element }) => (
  <View style={viewStyleProps(element.props)}>{renderChildren(element)}</View>
);
elementTypes['box'] = ToolBox;

const textToNumber = (text) => {
  const parsed = parseFloat(text);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const ToolNumberInput = ({ isSlider, element }) => {
  const textInputRef = useRef(null);

  const numberToText = (number) => {
    if (typeof number !== 'number') {
      return '0';
    }
    const decimalDigits =
      typeof element.props.decimalDigits == 'number' ? element.props.decimalDigits : 3;
    return parseFloat(number.toFixed(decimalDigits)).toString();
  };

  // Maintain `text` separately from `value` to allow incomplete text such as '' or '3.'
  const [text, setText] = useState('0');
  const [value, setValue] = useValue({
    element,
    onNewValue: (newValue) => {
      // Received a new value from Lua -- only update if the text input isn't currently focused
      // so that user interaction is interrupted
      if (!(textInputRef.current && textInputRef.current.isFocused())) {
        setText(numberToText(newValue));
      }
    },
  });

  const checkAndSetValue = (newValue) => {
    const { min, max } = element.props;
    if (typeof min === 'number' && newValue < min) {
      newValue = min;
    }
    if (typeof max === 'number' && newValue > max) {
      newValue = max;
    }
    setValue(newValue);
    return newValue;
  };

  const incrementValue = (delta) =>
    setText(numberToText(checkAndSetValue((value || 0) + delta * (element.props.step || 1))));

  return (
    <Labelled element={element}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        {isSlider ? (
          <Slider
            style={{
              flex: 1,

              // iOS slider has a large margin, make it smaller
              marginTop: Constants.iOS ? -4 : 0,
              marginBottom: Constants.iOS ? -3 : 0,

              // Android slider thumb is sorta small, make it bigger
              transform: Constants.Android ? [{ scaleX: 1.4 }, { scaleY: 1.4 }] : [],
            }}
            minimumValue={element.props.min}
            maximumValue={element.props.max}
            step={element.props.step || 1}
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              setText(numberToText(newValue));
            }}
          />
        ) : null}
        <View style={isSlider ? { width: 50, marginLeft: 4 } : { flex: 1 }}>
          <TextInput
            ref={textInputRef}
            keyboardType={
              Constants.iOS
                ? typeof element.props.min === 'number' && element.props.min >= 0
                  ? 'numeric'
                  : 'numbers-and-punctuation'
                : 'numeric'
            }
            style={textInputStyle}
            selectTextOnFocus
            returnKeyType="done"
            value={text}
            onChangeText={(newText) => {
              // User edited the text -- save the changes and also send updated value to Lua
              setText(newText);
              checkAndSetValue(textToNumber(newText));
            }}
            onSubmitEditing={({ nativeEvent: { text: newText } }) => {
              // Same as above
              setText(newText);
              checkAndSetValue(textToNumber(newText));
            }}
            onBlur={() => {
              // User unfocused the input -- revert text to reflect the value and discard edits
              setText(numberToText(value));
            }}
          />
          {false && // Temporarily skipping this workaround since we fit to `decimalDigits`
          Constants.Android &&
          !(textInputRef.current && textInputRef.current.isFocused()) ? (
            // Workaround for https://github.com/facebook/react-native/issues/14845... :|
            <View
              style={{
                ...textInputStyle,
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                right: 0,
                justifyContent: 'center',
                backgroundColor: Colors.background,
              }}>
              <TouchableWithoutFeedback
                style={{ flex: 1 }}
                onPress={() => {
                  if (textInputRef.current) {
                    textInputRef.current.focus();
                  }
                }}>
                <Text
                  style={{ color: Colors.textInput.text }}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {value}
                </Text>
              </TouchableWithoutFeedback>
            </View>
          ) : null}
        </View>
        {!isSlider ? (
          <Fragment>
            <TouchableOpacity
              style={{
                ...buttonStyle(),
                width: 32,
                marginLeft: 4,
              }}
              onPress={() => incrementValue(1)}>
              <Text style={{ color: Colors.button.text }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                ...buttonStyle(),
                width: 32,
                marginLeft: 4,
              }}
              onPress={() => incrementValue(-1)}>
              <Text style={{ color: Colors.button.text }}>-</Text>
            </TouchableOpacity>
          </Fragment>
        ) : null}
      </View>
    </Labelled>
  );
};
elementTypes['numberInput'] = ToolNumberInput;

const ToolSlider = ({ element }) => <ToolNumberInput element={element} isSlider />;
elementTypes['slider'] = ToolSlider;

const ToolSection = ({ element }) => {
  let headerChild = null;
  const children = [];

  if (element.open) {
    orderedChildren(element).forEach(({ id, child }) => {
      if (child.type == 'sectionHeader') {
        headerChild = child;
      } else {
        children.push({ id, child });
      }
    });
  }

  const headerButton = (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingLeft: 21,
        paddingRight: 14,
        borderTopLeftRadius: 8,
        borderTopRightRadius: headerChild ? 6 : 8,
        borderBottomLeftRadius: element.open ? 0 : 8,
        borderBottomRightRadius: element.open ? 0 : 8,
        backgroundColor: element.open ? Colors.button.selected : Colors.button.default,
        flex: headerChild ? 1 : null,
      }}
      onPress={() => sendEvent(element.pathId, { type: 'onChange', open: !element.open })}>
      <Text style={{ color: Colors.button.text, fontSize: 20, fontWeight: boldWeight1 }}>
        {element.props.label}
      </Text>
      <MaterialIcons
        name={element.open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
        size={20}
        color={Colors.text}
      />
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        margin: 4,
        borderBottomWidth: element.open ? 1 : 0,
        borderColor: Colors.button.selected,
        overflow: 'hidden',
      }}>
      {headerChild ? (
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          {headerButton}
          {renderChildren(headerChild)}
        </View>
      ) : (
        headerButton
      )}
      {element.open ? (
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 2,
          }}>
          {children.map(({ id, child }) => (
            <Tool key={id} element={child} />
          ))}
        </View>
      ) : null}
    </View>
  );
};
elementTypes['section'] = ToolSection;

const ToolData = ({ element }) => (
  <View>
    <Text>{JSON.stringify(element.props.data, null, 2)}</Text>
  </View>
);
elementTypes['data'] = ToolData;

export const getPaneData = (element) => {
  if (element) {
    let data;
    const dataChild = element.children['data'];
    if (dataChild) {
      return dataChild.props.data;
    }
  }
  return null;
};

export const sendDataPaneAction = (paneElement, action, value, childId) => {
  const dataChildPathId = paneElement.children[childId ?? 'data'].pathId;
  return sendEvent(dataChildPathId, { type: action, value });
};

const markdownStyles = StyleSheet.create({
  codeBlock: { borderColor: '#CCCCCC', backgroundColor: '#f5f5f5' },
  codeInline: { borderColor: '#CCCCCC', backgroundColor: '#f5f5f5' },
  del: { backgroundColor: Constants.colors.black },
  hr: { backgroundColor: Constants.colors.black },
  blockquote: { backgroundColor: '#CCCCCC' },
  table: { borderColor: Constants.colors.black },
  tableRow: { borderColor: Constants.colors.black },
  text: { color: Constants.colors.black },
  heading2: { fontSize: 16, fontWeight: 'bold' },
  blocklink: { borderColor: Constants.colors.black },
  u: { borderColor: Constants.colors.black },
  strong: { fontWeight: 'normal' },
});

const ToolMarkdown = ({ element }) => {
  const { transformAssetUri } = useContext(ToolsContext);

  return (
    <View style={{ margin: 4 }}>
      <Markdown
        style={markdownStyles}
        rules={{
          image: (node, children, parent, styles) => {
            return (
              <FitImage
                indicator={true}
                key={node.key}
                style={styles.image}
                source={{ uri: node.attributes.src && transformAssetUri(node.attributes.src) }}
              />
            );
          },
        }}>
        {element.props.source}
      </Markdown>
    </View>
  );
};
elementTypes['markdown'] = ToolMarkdown;

const ToolTabs = ({ element }) => {
  let [selected, setSelected] = useState(0);

  const children = orderedChildren(element).filter(({ id, child }) => child.type == 'tab');

  if (selected >= children.length) {
    selected = 0;
  }

  return (
    <View
      style={{
        margin: 4,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomWidth: 1,
        borderColor: Colors.button.selected,
        overflow: 'hidden',
        ...viewStyleProps(element.props.containerStyle),
      }}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        {children.map(({ id, child }, i) => (
          <TouchableOpacity
            key={id}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 6,
              backgroundColor: selected === i ? Colors.button.selected : Colors.button.default,
            }}
            onPress={() => setSelected(i)}>
            <Text style={{ color: Colors.button.text, fontSize: 20, fontWeight: boldWeight1 }}>
              {child.props.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View
        key={children[selected].id}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 2,
          ...viewStyleProps(element.props.contentStyle),
        }}>
        {renderChildren(children[selected].child)}
      </View>
    </View>
  );
};
elementTypes['tabs'] = ToolTabs;

const ToolCheckbox = ({ element, valueEventName = 'onChange', valuePropName = 'checked' }) => {
  const [value, setValue] = useValue({
    element,
    eventName: valueEventName,
    propName: valuePropName,
  });

  const { label, labelA, labelB } = element.props;

  return (
    <Labelled
      element={element}
      label={typeof label === 'string' ? label : value ? labelB : labelA}
      style={{ alignItems: 'flex-start' }}>
      <Switch
        value={value}
        style={{
          // iOS switch is sorta large, make it smaller
          margin: Constants.iOS ? -1 : 0,
          transform: Constants.iOS ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [],
        }}
        onValueChange={(newValue) => setValue(newValue)}
      />
    </Labelled>
  );
};
elementTypes['checkbox'] = ToolCheckbox;

const ToolToggle = ({ element }) => (
  <ToolCheckbox element={element} valueEventName="onToggle" valuePropName="toggled" />
);
elementTypes['toggle'] = ToolToggle;

const ToolDropdown = ({ element }) => {
  const [value, setValue] = useValue({ element });
  const { showActionSheetWithOptions } = useActionSheet();

  return (
    <Labelled element={element}>
      <TouchableOpacity
        style={{
          ...textInputStyle,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 4,
          paddingVertical: 8,
          paddingHorizontal: 12,
        }}
        onPress={() => {
          const itemsArray = objectToArray(element.props.items);
          showActionSheetWithOptions(
            { options: itemsArray.concat(['cancel']), cancelButtonIndex: itemsArray.length },
            (i) => {
              if (typeof i === 'number' && i >= 0 && i < itemsArray.length) {
                setValue(itemsArray[i]);
              }
            }
          );
        }}>
        <Text style={{ color: Colors.textInput.text }}>{value}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.text} />
      </TouchableOpacity>
    </Labelled>
  );
};
elementTypes['dropdown'] = ToolDropdown;

const ToolColorPicker = ({ element }) => {
  const [value, setValue] = useValue({ element });
  const [picking, setPicking] = useState(false);

  const anchorRef = useRef(null);

  let valueStr;
  if (value) {
    const r255 = 255 * value.r;
    const g255 = 255 * value.g;
    const b255 = 255 * value.b;
    valueStr = `rgb(${r255}, ${g255}, ${b255})`;
  }

  const setValueFromStr = (newValueStr) => {
    const rgba = tinycolor(newValueStr).toRgb();
    setValue({ r: rgba.r / 255.0, g: rgba.g / 255.0, b: rgba.b / 255.0, a: rgba.a });
  };

  return (
    <Labelled element={element}>
      <TouchableOpacity
        ref={anchorRef}
        style={{
          ...buttonStyle({ selected: picking }),
          alignSelf: 'flex-start',
        }}
        onPress={() => setPicking(true)}>
        <View style={{ width: 20, height: 20, backgroundColor: valueStr }} />
      </TouchableOpacity>
      <BasePopover
        fromView={anchorRef.current}
        isVisible={picking}
        onRequestClose={() => setPicking(false)}>
        <ColorPicker
          style={{ width: 200, height: 200 }}
          oldColor={valueStr}
          onColorChange={setValueFromStr}
          onColorSelected={(newValueStr) => {
            setValueFromStr(newValueStr);
            setPicking(false);
          }}
          onOldColorSelected={() => setPicking(false)}
        />
      </BasePopover>
    </Labelled>
  );
};
elementTypes['colorPicker'] = ToolColorPicker;

const ToolFilePicker = ({ element }) => {
  const [value, setValue] = useValue({ element });
  const [picking, setPicking] = useState(false);

  const anchorRef = useRef(null);

  // TODO: merge with Utilities.launchImagePicker(methodName, (result) => setValue(result.url))
  const launchImagePicker = (methodName) => {
    const options = { maxWidth: 1024, maxHeight: 1024, imageFileType: 'png' };

    if (Constants.Android) {
      // URIs may some times be 'content://', this forces copying to 'file://'
      options.rotation = 360;
    }

    ImagePicker[methodName](options, async ({ didCancel, error, uri }) => {
      if (!didCancel) {
        if (error) {
          Alert.alert('Error loading image', error);
        } else {
          setValue(uri);

          // Seems like we need to upload after a slight delay...
          setTimeout(async () => {
            const name = uri.match(/[^/]*$/)[0] || '';
            const extension = name.match(/[^.]*$/)[0] || '';
            const result = await Session.apolloClient.mutate({
              mutation: gql`
                mutation UploadFile($file: Upload!) {
                  uploadFile(file: $file) {
                    url
                  }
                }
              `,
              variables: {
                file: new ReactNativeFile({
                  uri,
                  name,
                  type:
                    extension === 'jpg'
                      ? 'image/jpeg'
                      : extension === 'jpg'
                      ? 'image/jpeg'
                      : extension === 'png'
                      ? 'image/png'
                      : 'application/octet-stream',
                }),
              },
              fetchPolicy: 'no-cache',
            });
            setValue(result.data.uploadFile.url);
          }, 80);
        }
      }
    });
  };

  return (
    <Labelled element={element}>
      <TouchableOpacity
        ref={anchorRef}
        style={{
          ...buttonStyle({ selected: picking }),
          alignSelf: 'flex-start',
        }}
        onPress={() => setPicking(true)}>
        {value ? (
          <ToolImage
            element={element}
            path={value}
            style={{
              margin: 0,
              width: 20,
              height: 20,
            }}
          />
        ) : (
          <Text style={{ color: Colors.text }}>no image</Text>
        )}
      </TouchableOpacity>
      <BasePopover
        fromView={anchorRef.current}
        isVisible={picking}
        onRequestClose={() => setPicking(false)}>
        <View style={{ width: 200, padding: 6 }}>
          <TouchableOpacity
            style={{ ...buttonStyle(), margin: 4 }}
            onPress={() => {
              setValue(undefined);
              setPicking(false);
            }}>
            <Text style={{ color: Colors.button.text }}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...buttonStyle(), margin: 4 }}
            onPress={() => launchImagePicker('launchImageLibrary')}>
            <Text style={{ color: Colors.button.text }}>Select from photos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...buttonStyle(), margin: 4 }}
            onPress={() => launchImagePicker('launchCamera')}>
            <Text style={{ color: Colors.button.text }}>Take a photo</Text>
          </TouchableOpacity>
        </View>
      </BasePopover>
    </Labelled>
  );
};
elementTypes['filePicker'] = ToolFilePicker;

const ToolScrollBox = ({ element }) => (
  <ScrollView
    style={viewStyleProps(element.props)}
    horizontal={element.props.horizontal}
    alwaysBounceHorizontal={element.props.alwaysBounceHorizontal}
    alwaysBounceVertical={element.props.alwaysBounceVertical}>
    {renderChildren(element)}
  </ScrollView>
);
elementTypes['scrollBox'] = ToolScrollBox;
