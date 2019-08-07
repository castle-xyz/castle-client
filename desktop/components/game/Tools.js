import * as React from 'react';
import * as NativeUtil from '~/native/nativeutil';
import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';
import * as Actions from '~/common/actions';

import { css, injectGlobal } from 'react-emotion';
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  Dropdown,
  NumberInput,
  Slider,
  RadioButton,
  Tab,
  Tabs,
  TextArea,
  TextInput,
  Toggle,
} from 'carbon-components-react';
import { space, color, border, layout, flexbox } from 'styled-system';
import { findDOMNode } from 'react-dom';

import ColorPicker from 'rc-color-picker';
import tinycolor from 'tinycolor2';
import styled from 'styled-components';
import Logs from '~/common/logs';
import ToolMarkdown from '~/components/game/ToolMarkdown';
import url from 'url';
import Dropzone from 'react-dropzone';
import MonacoEditor from 'react-monaco-editor';

import 'rc-color-picker/assets/index.css';
import '~/components/game/Tools.min.css';

//
// Infrastructure
//

let nextEventId = 1;
const sendEvent = (pathId, event) => {
  const eventId = nextEventId++;
  NativeUtil.sendLuaEvent('CASTLE_TOOL_EVENT', { pathId, event: { ...event, eventId } });
  return eventId;
};

const elementTypes = {};

class Tool extends React.PureComponent {
  render() {
    const { element } = this.props;
    const ElemType = elementTypes[element.type];
    if (!ElemType) {
      Logs.error(`'${element.type}' is not a valid UI element type`);
      return null;
    }
    return <ElemType element={element} />;
  }
}

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

const renderChildren = (element) =>
  orderedChildren(element).map(({ id, child }) => <Tool key={id} element={child} />);

const STYLES_PANE_CONTAINER = css`
  display: flex;
  flex-direction: column;
`;

class ToolPane extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <div className={STYLES_PANE_CONTAINER}>{renderChildren(element)}</div>;
  }
}
elementTypes['pane'] = ToolPane;

class Carbon extends React.PureComponent {
  render() {
    return <div className="carbon">{this.props.children}</div>;
  }
}

const Box = styled.div(
  {
    boxSizing: 'border-box',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  space,
  color,
  border,
  layout,
  flexbox
);

const ScrollBox = styled.div(
  {
    boxSizing: 'border-box',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    overflowY: 'scroll',
  },
  space,
  color,
  border,
  layout,
  flexbox
);

const Image = styled(Box)({
  maxWidth: '100%',
  alignSelf: 'flex-start',
  width: 'auto',
  height: 'auto',
});

Image.defaultProps = {
  as: 'img',
  m: 0,
};

export const ToolsContext = React.createContext({
  transformAssetUri: (uri) => uri,
});

//
// Components
//

class ToolBox extends React.PureComponent {
  render() {
    const { element } = this.props;

    return <Box {...element.props}>{renderChildren(element)}</Box>;
  }
}
elementTypes['box'] = ToolBox;

const STYLES_BUTTON_CONTAINER = css`
  width: 100%;
  margin-bottom: 14px;
`;

class ToolButton extends React.PureComponent {
  render() {
    const { element } = this.props;
    return (
      <div className={STYLES_BUTTON_CONTAINER}>
        <Carbon>
          <Button
            {...element.props}
            small={!(element.props && element.props.big)}
            kind={(element.props && element.props.kind) || 'secondary'}
            onClick={() => sendEvent(element.pathId, { type: 'onClick' })}>
            {element.props.label}
          </Button>
        </Carbon>
      </div>
    );
  }
}
elementTypes['button'] = ToolButton;

class ToolCheckbox extends React.PureComponent {
  state = {
    checked: this.props.element.props.checked,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        checked: props.element.props.checked,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Checkbox
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          checked={this.state.checked}
          onChange={(checked) => {
            this.setState({
              checked,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                checked,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['checkbox'] = ToolCheckbox;

const STYLES_MONACO_CONTAINER_WITH_RESIZE = css`
  width: 100%;
  position: relative;
`;

const STYLES_MONACO_RESIZER = css`
  position: relative;
  resize: vertical;
  overflow: auto;
  height: 300px;
  z-index: 1000;
  pointer-events: none;
`;

const STYLES_MONACO_CONTAINER = css`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
`;

class ToolCodeEditor extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  _monacoContainerDOMNode = null;
  _monacoEditorRef = null;
  _resizeObserver = null;

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;

    let maybeLabel = null;
    if (element.props && element.props.label && !element.props.hideLabel) {
      maybeLabel = (
        <label
          htmlFor={element.pathId}
          className={`bx--label${element.props.disabled ? `  bx--label--disabled` : ''}`}>
          {element.props.label}
        </label>
      );
    }

    let maybeHelperText = null;
    if (element.props && element.props.helperText) {
      maybeHelperText = (
        <helperText
          htmlFor={element.pathId}
          className={`bx--form__helper-text${
            element.props.disabled ? `  bx--form__helper-text--disabled` : ''
          }`}>
          {element.props.helperText}
        </helperText>
      );
    }

    return (
      <div className={STYLES_FILE_PICKER_CONTAINER}>
        <Carbon>
          {maybeLabel}
          {maybeHelperText}
        </Carbon>
        <div className={STYLES_MONACO_CONTAINER_WITH_RESIZE}>
          <div className={STYLES_MONACO_RESIZER} />
          <div className={STYLES_MONACO_CONTAINER} ref={this._handleMonacoContainerRef}>
            <MonacoEditor
              ref={(ref) => (this._monacoEditorRef = ref)}
              width="100%"
              height="100%"
              language="lua"
              theme="vs-dark"
              options={{
                fontSize: 14,

                minimap: { enabled: false },

                scrollBeyondLastColumn: false,
                scrollBeyondLastLine: false,

                lineNumbers: 'off',
                glyphMargin: false,
                folding: false,
                lineNumbersMinChars: 0,

                readOnly: !!element.props.disabled,
              }}
              value={this.state.value}
              onChange={(value) => {
                this.setState({
                  value,
                  lastSentEventId: sendEvent(element.pathId, {
                    type: 'onChange',
                    value,
                  }),
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  _handleMonacoContainerRef = (ref) => {
    // Unobserve previous
    if (this._monacoContainerDOMNode && this._resizeObserver) {
      this._resizeObserver.unobserve(this._monacoContainerDOMNode);
    }
    this._monacoContainerDOMNode = null;

    // Observe new
    if (ref) {
      this._monacoContainerDOMNode = findDOMNode(ref);

      if (!this._resizeObserver) {
        this._resizeObserver = new ResizeObserver((entries) => {
          if (this._monacoEditorRef) {
            this._monacoEditorRef.editor.layout();
          }
        });
      }

      this._resizeObserver.observe(this._monacoContainerDOMNode);
    }
  };
}
elementTypes['codeEditor'] = ToolCodeEditor;

const STYLES_COLOR_PICKER_CONTAINER = css`
  font-family: 'sf-mono', Consolas, monaco, monospace;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.125rem;
  letter-spacing: 0.16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: flex-start;
  margin-bottom: 14px;
`;

injectGlobal`
  .rc-color-picker-panel {
    background-color: #282828 !important;
  }

  .rc-color-picker-panel {
    border-radius: 0px !important;
    border: none !important;
  }

  .rc-color-picker-panel-inner {
    box-shadow: none !important;
    border-radius: 0px !important;
    border: 1px solid #3d3d3d !important;
    border-bottom: 1px solid #6f6f6f !important;
    padding-top: 2px !important;
  }

  .rc-color-picker-panel-params-lable {
    color: #fff !important;
  }

  .rc-color-picker-panel-params-lable-number:hover {
    color: #000 !important;
  }

  .rc-color-picker-panel-params input {
    border: 1px solid #cacaca !important;
    font-family: ${Constants.font.mono} !important;
  }
`;

class ToolColorPicker extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;

    let maybeLabel = null;
    if (element.props && element.props.label && !element.props.hideLabel) {
      maybeLabel = (
        <label
          htmlFor={element.pathId}
          className={`bx--label${element.props.disabled ? `  bx--label--disabled` : ''}`}>
          {element.props.label}
        </label>
      );
    }

    let maybeHelperText = null;
    if (element.props && element.props.helperText) {
      maybeHelperText = (
        <helperText
          htmlFor={element.pathId}
          className={`bx--form__helper-text${
            element.props.disabled ? `  bx--form__helper-text--disabled` : ''
          }`}>
          {element.props.helperText}
        </helperText>
      );
    }

    const value = this.state.value;
    const hex = tinycolor({
      r: 255 * value.r,
      g: 255 * value.g,
      b: 255 * value.b,
    }).toHexString();
    const alpha = 100 * value.a;

    return (
      <div className={STYLES_COLOR_PICKER_CONTAINER}>
        <Carbon>
          {maybeLabel}
          {maybeHelperText}
        </Carbon>
        <ColorPicker
          color={hex}
          alpha={alpha}
          enableAlpha={element.props && element.props.enableAlpha}
          mode={element.props && element.props.mode}
          onChange={({ color, alpha }) => {
            const rgb = tinycolor(color).toRgb();
            const value = {
              r: rgb.r / 255,
              g: rgb.g / 255,
              b: rgb.b / 255,
              a: alpha / 100,
            };
            this.setState({
              value,
              lastSentEventId: sendEvent(this.props.element.pathId, {
                type: 'onChange',
                value,
              }),
            });
          }}
        />
      </div>
    );
  }
}
elementTypes['colorPicker'] = ToolColorPicker;

class ToolDropdown extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value || null, // Force `null` when value is unset
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;

    let items = (element.props && element.props.items) || [];
    if (!Array.isArray(items)) {
      let arrayItems = [];
      Object.keys(items).map((key) => (arrayItems[parseInt(key, 10) - 1] = items[key]));
      items = arrayItems;
    }

    return (
      <Carbon>
        <Dropdown
          {...element.props}
          id={element.pathId}
          items={items}
          selectedItem={this.state.value}
          titleText={element.props && !element.props.hideLabel ? element.props.label : null}
          label={
            element.props && element.props.placeholder
              ? element.props.placeholder
              : 'Select an option...'
          }
          onChange={({ selectedItem }) => {
            this.setState({
              value: selectedItem,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: selectedItem,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['dropdown'] = ToolDropdown;

const STYLES_FILE_PICKER_CONTAINER = css`
  font-family: 'sf-mono', Consolas, monaco, monospace;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.125rem;
  letter-spacing: 0.16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: flex-start;
  margin-bottom: 14px;
`;

const STYLES_FILE_PICKER_DRAG_ROOT = css`
  width: 100%;
`;

const STYLES_FILE_PICKER_BUTTON_ROW = css`
  width: 100%;
  margin-top: 4px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_FILE_PICKER_BUTTON_CONTAINER = css`
  .bx--btn {
    width: 126px !important;
    margin-bottom: none !important;
    flex-shrink: 1 !important;
  }
`;

const STYLES_FILE_PICKER_INFO = css`
  flex: 1;
  font-family: 'sf-mono', Consolas, monaco, monospace;
  font-size: 0.75rem;
  font-style: italic;
  line-height: 1rem;
  letter-spacing: 0.32px;
  font-style: italic;
  color: #bebebe;

  a:visited {
    color: #ff00ff;
  }
  a:hover {
    color: #8f79d8;
  }
  a {
    color: #ff00ff;
    font-weight: 600;
    -webkit-transition: 200ms ease color;
    transition: 200ms ease color;
  }
`;

const STYLES_FILE_PICKER_PREVIEW_IMAGE = css`
  max-height: 32px;
  max-width: 32px;
`;

class ToolFilePicker extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;

    let maybeLabel = null;
    if (element.props && element.props.label && !element.props.hideLabel) {
      maybeLabel = (
        <label
          htmlFor={element.pathId}
          className={`bx--label${element.props.disabled ? `  bx--label--disabled` : ''}`}>
          {element.props.label}
        </label>
      );
    }

    let maybeHelperText = null;
    if (element.props && element.props.helperText) {
      maybeHelperText = (
        <helperText
          htmlFor={element.pathId}
          className={`bx--form__helper-text${
            element.props.disabled ? `  bx--form__helper-text--disabled` : ''
          }`}>
          {element.props.helperText}
        </helperText>
      );
    }

    return (
      <div className={STYLES_FILE_PICKER_CONTAINER}>
        <Carbon>
          {maybeLabel}
          {maybeHelperText}
        </Carbon>
        <Dropzone
          noClick
          multiple={false}
          onDrop={this._handleOnDrop}
          accept={element.props.type === 'image' ? 'image/*' : undefined}>
          {({ getRootProps, getInputProps, open }) => (
            <div className={STYLES_FILE_PICKER_DRAG_ROOT} {...getRootProps()}>
              <input {...getInputProps()} />
              <div className={STYLES_FILE_PICKER_INFO}>
                {this.state.value ? (
                  element.props.type === 'image' ? (
                    <img className={STYLES_FILE_PICKER_PREVIEW_IMAGE} src={this.state.value} />
                  ) : (
                    <a href={this.state.value}>Open</a>
                  )
                ) : (
                  'No file'
                )}
              </div>
              <div className={STYLES_FILE_PICKER_BUTTON_ROW}>
                {this.state.value && !this.state.uploading ? (
                  <Carbon>
                    <div className={STYLES_FILE_PICKER_BUTTON_CONTAINER}>
                      <Button small kind="secondary" onClick={this._handleOnClickRemove}>
                        Remove
                      </Button>
                    </div>
                  </Carbon>
                ) : null}
                <Carbon>
                  <div className={STYLES_FILE_PICKER_BUTTON_CONTAINER}>
                    <Button small kind="secondary" onClick={open} disabled={this.state.uploading}>
                      {this.state.uploading ? 'Uploading...' : 'Browse'}
                    </Button>
                  </div>
                </Carbon>
              </div>
            </div>
          )}
        </Dropzone>
      </div>
    );
  }

  _handleOnDrop = async (files) => {
    this.setState({ uploading: true });
    try {
      const result = await Actions.uploadImageAsync({ file: files[0] });
      this.setState({
        value: result.url,
        lastSentEventId: sendEvent(this.props.element.pathId, {
          type: 'onChange',
          value: result.url,
        }),
      });
    } catch (e) {
      // TODO(nikki): Report this error somehow...
    } finally {
      this.setState({ uploading: false });
    }
  };

  _handleOnClickRemove = () => {
    this.setState({
      value: undefined,
      lastSentEventId: sendEvent(this.props.element.pathId, {
        type: 'onChange',
        value: undefined,
      }),
    });
  };
}
elementTypes['filePicker'] = ToolFilePicker;

const STYLES_IMAGE = css`
  margin-bottom: 14px;
`;

class ToolImage extends React.PureComponent {
  render() {
    const { element } = this.props;

    return (
      <ToolsContext.Consumer>
        {({ transformAssetUri }) => (
          <Image
            className={STYLES_IMAGE}
            {...element.props}
            src={element.props && element.props.path && transformAssetUri(element.props.path)}
          />
        )}
      </ToolsContext.Consumer>
    );
  }
}
elementTypes['image'] = ToolImage;

elementTypes['markdown'] = ToolMarkdown;

class ToolNumberInput extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <NumberInput
          {...element.props}
          id={element.pathId}
          value={this.state.value}
          onChange={(event) => {
            this.setState({
              value: event.imaginaryTarget.valueAsNumber,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: event.imaginaryTarget.valueAsNumber,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['numberInput'] = ToolNumberInput;

class ToolRadioButtonGroup extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;

    let maybeLabel = null;
    if (element.props && element.props.label && !element.props.hideLabel) {
      maybeLabel = (
        <label
          htmlFor={element.pathId}
          className={`bx--label${element.props.disabled ? `  bx--label--disabled` : ''}`}>
          {element.props.label}
        </label>
      );
    }

    let maybeHelperText = null;
    if (element.props && element.props.helperText) {
      maybeHelperText = (
        <helperText
          htmlFor={element.pathId}
          className={`bx--form__helper-text${
            element.props.disabled ? `  bx--form__helper-text--disabled` : ''
          }`}>
          {element.props.helperText}
        </helperText>
      );
    }

    let items = (element.props && element.props.items) || [];
    if (!Array.isArray(items)) {
      let arrayItems = [];
      Object.keys(items).map((key) => (arrayItems[parseInt(key, 10) - 1] = items[key]));
      items = arrayItems;
    }

    return (
      <Carbon>
        <div className="bx--form-item">
          {maybeLabel}
          {maybeHelperText}
          <div
            className={
              element.props && element.props.horizontal
                ? 'bx--radio-button-group'
                : 'bx--radio-button-group--vertical'
            }>
            {items.map((item) => (
              <RadioButton
                key={item}
                item={item}
                labelText={item}
                checked={this.state.value == item}
                disabled={element.props && element.props.disabled}
                onChange={(value, name, event) => {
                  if (event.target.checked) {
                    this.setState({
                      value: item,
                      lastSentEventId: sendEvent(element.pathId, {
                        type: 'onChange',
                        value: item,
                      }),
                    });
                  }
                }}
              />
            ))}
          </div>
        </div>
      </Carbon>
    );
  }
}
elementTypes['radioButtonGroup'] = ToolRadioButtonGroup;

const STYLES_SCROLLBOX_CONTAINER = css`
  ::-webkit-scrollbar {
    width: 8px;
    height: 100%;
  }

  ::-webkit-scrollbar-track {
    background: black;
  }

  ::-webkit-scrollbar-thumb {
    background: white;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: magenta;
  }
`;

class ToolScrollBox extends React.PureComponent {
  render() {
    const { element } = this.props;

    return (
      <ScrollBox className={STYLES_SCROLLBOX_CONTAINER} {...element.props}>
        {renderChildren(element)}
      </ScrollBox>
    );
  }
}
elementTypes['scrollBox'] = ToolScrollBox;

// Copied from Carbon CSS, so that we can apply only to Accordion itself but not its children
const STYLES_SECTION_CONTAINER = css`
  .bx--accordion {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font-family: inherit;
    vertical-align: baseline;
    list-style: none;
    width: 100%;
  }
  .bx--accordion > *,
  .bx--accordion > *:before,
  .bx--accordion > *:after {
    box-sizing: inherit;
  }
  .bx--accordion__item {
    transition: all 110ms cubic-bezier(0.2, 0, 0.38, 0.9);
    border-top: 1px solid #3d3d3d;
    overflow: visible;
  }
  .bx--accordion__item:last-child {
    border-bottom: 1px solid #3d3d3d;
  }
  .bx--accordion__heading {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font-family: inherit;
    vertical-align: baseline;
    display: inline-block;
    background: none;
    appearance: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    width: 100%;
    color: #f3f3f3;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
    padding: 0.375rem 0;
    flex-direction: row-reverse;
    position: relative;
    width: 100%;
    margin: 0;
    transition: background-color cubic-bezier(0.2, 0, 0.38, 0.9) 110ms;
  }
  .bx--accordion__heading > *,
  .bx--accordion__heading > *:before,
  .bx--accordion__heading > *:after {
    box-sizing: inherit;
  }
  .bx--accordion__heading::-moz-focus-inner {
    border: 0;
  }
  .bx--accordion__heading:hover:before,
  .bx--accordion__heading:focus:before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: calc(100% + 2px);
  }
  .bx--accordion__heading:hover:before {
    background-color: #353535;
  }
  .bx--accordion__heading:focus {
    outline: none;
  }
  .bx--accordion__heading:focus:before {
    border: 2px solid #ff00ff;
    box-sizing: border-box;
  }
  .bx--accordion__arrow {
    outline: 2px solid transparent;
    outline-offset: -2px;
    flex: 0 0 1rem;
    width: 1rem;
    height: 1rem;
    margin: 0 1rem 0 0;
    fill: #f3f3f3;
    transform: rotate(90deg);
    transition: all 110ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  .bx--accordion__title {
    font-family: 'sf-mono', Consolas, monaco, monospace;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.25rem;
    letter-spacing: 0.16px;
    margin: 0 0 0 1rem;
    width: 100%;
    text-align: left;
    z-index: 0;
  }
  .bx--accordion__content {
    transition: height cubic-bezier(0.2, 0, 0.38, 0.9) 110ms,
      padding cubic-bezier(0.2, 0, 0.38, 0.9) 110ms;
    padding-left: 1rem;
    padding-right: 25%;
    height: 0;
    visibility: hidden;
    opacity: 0;
  }
  @media (max-width: 42rem) {
    .bx--accordion__content {
      padding-right: 3rem;
    }
  }
  .bx--accordion__content p {
    font-family: 'sf-mono', Consolas, monaco, monospace;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.25rem;
    letter-spacing: 0.16px;
  }
  .bx--accordion__item--active {
    overflow: visible;
  }
  .bx--accordion__item--active .bx--accordion__content {
    padding-bottom: 1.5rem;
    padding-top: 0.5rem;
    height: auto;
    visibility: visible;
    opacity: 1;
    transition: height cubic-bezier(0, 0, 0.38, 0.9) 110ms,
      padding-top cubic-bezier(0, 0, 0.38, 0.9) 110ms,
      padding-bottom cubic-bezier(0, 0, 0.38, 0.9) 110ms;
  }
  .bx--accordion__item--active .bx--accordion__arrow {
    /*rtl:ignore*/
    transform: rotate(-90deg);
    fill: #f3f3f3;
  }
  .bx--accordion.bx--skeleton .bx--accordion__heading,
  .bx--accordion.bx--skeleton .bx--accordion__button {
    cursor: default;
  }
  .bx--accordion.bx--skeleton .bx--accordion__arrow {
    pointer-events: none;
    fill: #f3f3f3;
    cursor: default;
  }
  .bx--accordion.bx--skeleton .bx--accordion__arrow:hover,
  .bx--accordion.bx--skeleton .bx--accordion__arrow:focus,
  .bx--accordion.bx--skeleton .bx--accordion__arrow:active {
    border: none;
    outline: none;
    cursor: default;
  }
  .bx--skeleton .bx--accordion__heading:focus .bx--accordion__arrow {
    border: none;
    outline: none;
    cursor: default;
  }
  .bx--accordion__title.bx--skeleton__text {
    margin-bottom: 0;
  }
`;

class ToolSection extends React.PureComponent {
  render() {
    const { element } = this.props;

    return (
      <div className={STYLES_SECTION_CONTAINER}>
        <Accordion>
          <AccordionItem
            {...element.props}
            ref={(r) => (this._accordionItemRef = r)}
            title={element.props && element.props.label}
            open={element.open}
            onHeadingClick={({ isOpen }) => {
              sendEvent(element.pathId, { type: 'onChange', open: isOpen });
              // Make it listen to our `element.open` state...
              this._accordionItemRef &&
                this._accordionItemRef.setState({ open: element.open, prevOpen: element.open });
            }}>
            {renderChildren(element)}
          </AccordionItem>
        </Accordion>
      </div>
    );
  }
}
elementTypes['section'] = ToolSection;

class ToolSlider extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Slider
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          value={this.state.value}
          onChange={({ value }) => {
            value = typeof value === 'number' ? value : Number.parseFloat(value);
            this.setState({
              value,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['slider'] = ToolSlider;

const STYLES_TABS_CONTAINER = css`
  border-bottom: 1px solid #3d3d3d !important;
  padding-bottom: 0.6rem !important;

  .bx--tabs {
    font-family: 'sf-mono', Consolas, monaco, monospace;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.125rem;
    letter-spacing: 0.16px;
    color: #f3f3f3;
    height: auto;
    width: 100%;
    position: relative;
  }
  @media (min-width: 42rem) {
    .bx--tabs {
      background: none;
      min-height: 3rem;
    }
  }
  .bx--tabs-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 2.5rem;
    cursor: pointer;
    color: #f3f3f3;
    outline: 2px solid transparent;
    border-bottom: 1px solid #6f6f6f;
    background-color: #282828;
  }
  @media (min-width: 42rem) {
    .bx--tabs-trigger {
      display: none;
    }
  }
  .bx--tabs-trigger:focus,
  .bx--tabs-trigger:active {
    outline: 2px solid #ff00ff;
    outline-offset: -2px;
  }
  .bx--tabs-trigger svg {
    width: 0.75rem;
    height: 0.4375rem;
    fill: #f3f3f3;
    transition: transform 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  .bx--tabs-trigger--open:focus,
  .bx--tabs-trigger--open:active {
    outline: 2px solid transparent;
    outline-offset: -2px;
    transition: outline 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  .bx--tabs-trigger--open {
    background: #3d3d3d;
  }
  .bx--tabs-trigger--open svg {
    transform: rotate(-180deg);
    transition: transform 70ms;
    transform-origin: 50% 45%;
  }
  .bx--tabs--light.bx--tabs-trigger {
    background-color: #3d3d3d;
  }
  .bx--tabs-trigger-text {
    text-decoration: none;
    padding-top: 2px;
    color: #f3f3f3;
    font-weight: 400;
  }
  .bx--tabs-trigger-text:hover {
    color: #f3f3f3;
  }
  .bx--tabs-trigger-text:focus {
    outline: none;
  }
  .bx--tabs__nav {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.1);
    margin: 0;
    padding: 0;
    position: absolute;
    list-style: none;
    display: flex;
    flex-direction: column;
    z-index: 7000;
    background: #282828;
    transition: max-height 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
    max-height: 600px;
    width: 100%;
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav {
      flex-direction: row;
      background: none;
      box-shadow: none;
      z-index: auto;
      transition: inherit;
      max-height: auto;
      width: auto;
    }
  }
  .bx--tabs__nav--hidden {
    transition: max-height 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
    overflow: hidden;
    max-height: 0;
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav--hidden {
      display: flex;
      transition: inherit;
      overflow: visible;
      max-height: none;
    }
  }
  .bx--tabs__nav-item {
    background-color: #282828;
    display: flex;
    padding: 0;
    cursor: pointer;
    width: 100%;
    height: 2.5rem;
    transition: background-color 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav-item {
      background: transparent;
      height: auto;
    }
    .bx--tabs__nav-item + .bx--tabs__nav-item {
      margin-left: 0.125rem;
    }
  }
  .bx--tabs__nav-item .bx--tabs__nav-link {
    transition: color 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
      border-bottom-color 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
      outline 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav-item:hover:not(.bx--tabs__nav-item--selected) {
      background: transparent;
    }
  }
  .bx--tabs__nav-item:hover:not(.bx--tabs__nav-item--disabled) {
    background-color: #353535;
    box-shadow: 0 -1px 0 #353535;
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav-item:hover:not(.bx--tabs__nav-item--disabled) {
      background-color: transparent;
      box-shadow: none;
    }
  }
  .bx--tabs__nav-item--disabled,
  .bx--tabs__nav-item--disabled:hover {
    cursor: not-allowed;
  }
  .bx--tabs__nav-item--selected:not(.bx--tabs__nav-item--disabled) {
    border: none;
    display: none;
    transition: color 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav-item--selected:not(.bx--tabs__nav-item--disabled) {
      display: flex;
    }
    .bx--tabs__nav-item--selected:not(.bx--tabs__nav-item--disabled) .bx--tabs__nav-link {
      color: #f3f3f3;
      font-family: 'sf-mono', Consolas, monaco, monospace;
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.125rem;
      letter-spacing: 0.16px;
      border-bottom: 3px solid #ff00ff;
    }
    .bx--tabs__nav-item--selected:not(.bx--tabs__nav-item--disabled) .bx--tabs__nav-link:focus,
    .bx--tabs__nav-item--selected:not(.bx--tabs__nav-item--disabled) .bx--tabs__nav-link:active {
      color: #f3f3f3;
      border-bottom: 2px solid #ff00ff;
    }
  }
  a.bx--tabs__nav-link {
    outline: 2px solid transparent;
    outline-offset: -2px;
    display: inline-block;
    color: #bebebe;
    text-decoration: none;
    font-weight: 400;
    padding: 0.75rem 0;
    width: calc(100% - 32px);
    height: 2.5rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin: 0 1rem;
    line-height: 1rem;
    border-bottom: 1px solid #3d3d3d;
    overflow: hidden;
    transition: border 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
      outline 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }
  a.bx--tabs__nav-link:focus,
  a.bx--tabs__nav-link:active {
    width: 100%;
    margin: 0;
    padding-left: 16px;
    outline: 2px solid #ff00ff;
    outline-offset: -2px;
  }
  @media (min-width: 42rem) {
    a.bx--tabs__nav-link {
      border-bottom: 3px solid #bebebe;
      padding: 0.5rem 1rem;
      width: 10rem;
      margin: 0;
      line-height: inherit;
    }
    a.bx--tabs__nav-link:focus,
    a.bx--tabs__nav-link:active {
      width: 10rem;
      padding: 0.5rem 1rem;
      border-bottom: 2px;
    }
  }
  .bx--tabs__nav-item:hover:not(.bx--tabs__nav-item--selected):not(.bx--tabs__nav-item--disabled)
    .bx--tabs__nav-link {
    color: #f3f3f3;
  }
  @media (min-width: 42rem) {
    .bx--tabs__nav-item:hover:not(.bx--tabs__nav-item--selected):not(.bx--tabs__nav-item--disabled)
      .bx--tabs__nav-link {
      color: #f3f3f3;
      border-bottom: 3px solid #6f6f6f;
    }
  }
  .bx--tabs__nav-item--disabled .bx--tabs__nav-link {
    color: #bebebe;
    border-bottom: 3px solid #f3f3f3;
  }
  .bx--tabs__nav-item--disabled:hover .bx--tabs__nav-link {
    cursor: no-drop;
    border-bottom: 3px solid #f3f3f3;
  }
  .bx--tabs__nav-item--disabled .bx--tabs__nav-link:focus,
  .bx--tabs__nav-item--disabled a.bx--tabs__nav-link:active {
    outline: none;
    border-bottom: 3px solid #f3f3f3;
  }
  .bx--tabs__nav-item:not(.bx--tabs__nav-item--selected):not(.bx--tabs__nav-item--disabled):not(.bx--tabs__nav-item--selected)
    .bx--tabs__nav-link:focus,
  .bx--tabs__nav-item:not(.bx--tabs__nav-item--selected):not(.bx--tabs__nav-item--disabled):not(.bx--tabs__nav-item--selected)
    a.bx--tabs__nav-link:active {
    color: #bebebe;
  }
  .bx--tabs.bx--skeleton {
    pointer-events: none;
    cursor: default;
  }
  .bx--tabs.bx--skeleton .bx--tabs__nav-link {
    position: relative;
    border: none;
    padding: 0;
    box-shadow: none;
    pointer-events: none;
    background: rgba(61, 112, 178, 0.1);
    width: 4.6875rem;
    height: 0.75rem;
  }
  .bx--tabs.bx--skeleton .bx--tabs__nav-link:hover,
  .bx--tabs.bx--skeleton .bx--tabs__nav-link:focus,
  .bx--tabs.bx--skeleton .bx--tabs__nav-link:active {
    border: none;
    outline: none;
    cursor: default;
  }
  .bx--tabs.bx--skeleton .bx--tabs__nav-link:before {
    content: '';
    width: 0%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.3;
    background: rgba(61, 112, 178, 0.1);
    animation: 3000ms ease-in-out skeleton infinite;
  }
  .bx--tabs.bx--skeleton .bx--tabs-trigger {
    position: relative;
    border: none;
    padding: 0;
    box-shadow: none;
    pointer-events: none;
    background: rgba(61, 112, 178, 0.1);
    width: 6.25rem;
  }
  .bx--tabs.bx--skeleton .bx--tabs-trigger:hover,
  .bx--tabs.bx--skeleton .bx--tabs-trigger:focus,
  .bx--tabs.bx--skeleton .bx--tabs-trigger:active {
    border: none;
    outline: none;
    cursor: default;
  }
  .bx--tabs.bx--skeleton .bx--tabs-trigger:before {
    content: '';
    width: 0%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0.3;
    background: rgba(61, 112, 178, 0.1);
    animation: 3000ms ease-in-out skeleton infinite;
  }
  .bx--tabs.bx--skeleton .bx--tabs-trigger svg {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
    visibility: visible;
    white-space: nowrap;
  }
`;

class ToolTabs extends React.PureComponent {
  componentDidMount() {
    const { element } = this.props;
    const children = orderedChildren(element).filter(({ id, child }) => child.type == 'tab');
    if (children[0]) {
      sendEvent(children[0].child.pathId, { type: 'onActive', value: true });
    }
  }

  render() {
    const { element } = this.props;

    const children = orderedChildren(element).filter(({ id, child }) => child.type == 'tab');

    return (
      <div className={STYLES_TABS_CONTAINER}>
        <Tabs
          {...element.props}
          onSelectionChange={(activeIndex) =>
            children.forEach(({ id, child }, childIndex) =>
              sendEvent(child.pathId, { type: 'onActive', value: childIndex === activeIndex })
            )
          }>
          {children.map(({ id, child }) => (
            <Tab key={id} {...child.props} href="javascript:void(0);">
              {renderChildren(child)}
            </Tab>
          ))}
        </Tabs>
      </div>
    );
  }
}
elementTypes['tabs'] = ToolTabs;

class ToolTextArea extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <TextArea
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          value={this.state.value}
          onChange={(event) => {
            this.setState({
              value: event.target.value,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: event.target.value,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['textArea'] = ToolTextArea;

class ToolTextInput extends React.PureComponent {
  state = {
    value: this.props.element.props.value,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        value: props.element.props.value,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <TextInput
          {...element.props}
          id={element.pathId}
          labelText={element.props && element.props.label}
          value={this.state.value}
          onChange={(event) => {
            this.setState({
              value: event.target.value,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onChange',
                value: event.target.value,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['textInput'] = ToolTextInput;

class ToolToggle extends React.PureComponent {
  state = {
    toggled: this.props.element.props.toggled,
    lastSentEventId: null,
  };

  static getDerivedStateFromProps(props, state) {
    if (
      state.lastSentEventId === null ||
      props.element.lastReportedEventId == state.lastSentEventId
    ) {
      return {
        toggled: props.element.props.toggled,
      };
    }
    return null;
  }

  render() {
    const { element } = this.props;
    return (
      <Carbon>
        <Toggle
          {...element.props}
          id={element.pathId}
          toggled={this.state.toggled}
          onToggle={(toggled) => {
            this.setState({
              toggled,
              lastSentEventId: sendEvent(element.pathId, {
                type: 'onToggle',
                toggled,
              }),
            });
          }}
        />
      </Carbon>
    );
  }
}
elementTypes['toggle'] = ToolToggle;

//
// Container
//

const applyDiff = (t, diff) => {
  if (diff == null) {
    return t;
  }

  // If it's an exact diff just return it
  if (diff.__exact) {
    delete diff.__exact;
    return diff;
  }

  // Copy untouched keys, then apply diffs to touched keys
  t = typeof t === 'object' ? t : {};
  const u = {};
  for (let k in t) {
    if (!(k in diff)) {
      u[k] = t[k];
    }
  }
  for (let k in diff) {
    const v = diff[k];
    if (typeof v === 'object') {
      u[k] = applyDiff(t[k], v);
    } else if (v !== '__NIL') {
      u[k] = v;
    }
  }
  return u;
};

// NOTE(jim): Remember to delete this after new UI lands.
const STYLES_CONTAINER_V2 = css`
  font-family: ${Constants.font.mono} !important;
  font-size: 10px;

  /* Based on the 'g90' theme (https://www.carbondesignsystem.com/guidelines/themes/) which 'Tools.scss' uses */
  color: #f3f3f3;

  /* Inputs seem to not properly hide the spinner buttons */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Make input elements stretch to width of container */
  .bx--form-item {
    align-items: stretch !important;
  }

  /* Sliders are too wide by default */
  .bx--slider {
    min-width: 0 !important;
    flex: 1;
  }

  /* Fix number input fonts */
  input[type='number'] {
    font-family: ${Constants.font.mono} !important;
  }

  /* Justify radio button labels to left */
  .bx--radio-button-group--vertical .bx--radio-button__label {
    justify-content: flex-start !important;
  }

  /* Make accordion children stretch */
  .bx--accordion__item--active .bx--accordion__content {
    padding-left: 1rem !important;
    padding-right: 0.8rem !important;
    padding-bottom: 0.8rem !important;
  }

  /* Make tab headers fit */
  .bx--tabs__nav {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
  }
  .bx--tabs__nav-item {
    display: flex !important;
    flex: 1 !important;
    width: auto !important;
  }
  a.bx--tabs__nav-link,
  a.bx--tabs__nav-link:focus,
  a.bx--tabs__nav-link:active {
    display: flex !important;
    flex: 1 !important;
    width: auto !important;
  }

  /* Add some general bottom margin */
  .bx--number,
  .bx--text-input__field-wrapper,
  .bx--text-area__wrapper,
  .bx--dropdown,
  .bx--radio-button-group--vertical,
  .bx--slider-container,
  .bx--accordion,
  .bx--toggle__label,
  .tabs-container {
    margin-bottom: 12px !important;
  }

  padding: 12px;
`;

const STYLES_CONTAINER = css`
  height: 100%;

  font-family: ${Constants.font.mono} !important;

  /* Based on the 'g90' theme (https://www.carbondesignsystem.com/guidelines/themes/) which 'Tools.scss' uses */
  color: #f3f3f3;
  background-color: #000000;

  /* Inputs seem to not properly hide the spinner buttons */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Make input elements stretch to width of container */
  .bx--form-item {
    align-items: stretch !important;
  }

  /* Sliders are too wide by default */
  .bx--slider {
    min-width: 0 !important;
    flex: 1;
  }

  /* Fix number input fonts */
  input[type='number'] {
    font-family: ${Constants.font.mono} !important;
  }

  /* Justify radio button labels to left */
  .bx--radio-button-group--vertical .bx--radio-button__label {
    justify-content: flex-start !important;
  }

  /* Make accordion children stretch */
  .bx--accordion__item--active .bx--accordion__content {
    padding-left: 1rem !important;
    padding-right: 0.8rem !important;
    padding-bottom: 0.8rem !important;
  }

  /* Make tab headers fit */
  .bx--tabs__nav {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
  }
  .bx--tabs__nav-item {
    display: flex !important;
    flex: 1 !important;
    width: auto !important;
  }
  a.bx--tabs__nav-link,
  a.bx--tabs__nav-link:focus,
  a.bx--tabs__nav-link:active {
    display: flex !important;
    flex: 1 !important;
    width: auto !important;
  }

  /* Add some general bottom margin */
  .bx--number,
  .bx--text-input__field-wrapper,
  .bx--text-area__wrapper,
  .bx--dropdown,
  .bx--radio-button-group--vertical,
  .bx--slider-container,
  .bx--accordion,
  .bx--toggle__label,
  .tabs-container {
    margin-bottom: 14px !important;
  }

  padding: 14px;

  overflow-y: scroll;
  overflow-x: hidden;

  ::-webkit-scrollbar {
    width: 8px;
    height: 100%;
  }

  ::-webkit-scrollbar-track {
    background: black;
  }

  ::-webkit-scrollbar-thumb {
    background: white;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: magenta;
  }
`;

const STYLES_SPLITTER_CONTAINER = css`
  height: 100%;
  min-height: 25%;
  width: 100%;
`;

const DEBUG_PREPOPULATED = false;

export default class Tools extends React.PureComponent {
  static initialState = {
    root: DEBUG_PREPOPULATED
      ? {
          panes: {
            DEFAULT: {
              type: 'pane',
              props: {
                name: 'DEFAULT',
              },
              children: {
                scrollBoxscrollBox1: {
                  type: 'scrollBox',
                  children: {
                    'buttonButton 2': {
                      type: 'button',
                      prevId: 'markdownRow 2',
                      pathId: 'M2zVSmMv2v7J4/NkSuNbiA==',
                      props: {
                        label: 'Button 2',
                      },
                    },
                    'buttonButton 7': {
                      type: 'button',
                      prevId: 'markdownRow 7',
                      pathId: 'RU35sM5KLJoM5VNwExRDKA==',
                      props: {
                        label: 'Button 7',
                      },
                    },
                    'markdownRow 3': {
                      type: 'markdown',
                      prevId: 'buttonButton 2',
                      props: {
                        source: 'Row 3',
                      },
                    },
                    'markdownRow 5': {
                      type: 'markdown',
                      prevId: 'buttonButton 4',
                      props: {
                        source: 'Row 5',
                      },
                    },
                    'buttonButton 1': {
                      type: 'button',
                      prevId: 'markdownRow 1',
                      pathId: 'PlxZ3gcfZoR24irXQ+4ZWQ==',
                      props: {
                        label: 'Button 1',
                      },
                    },
                    'buttonButton 4': {
                      type: 'button',
                      prevId: 'markdownRow 4',
                      pathId: 'iWxh1j/rQEESiqy1SVvBTw==',
                      props: {
                        label: 'Button 4',
                      },
                    },
                    'buttonButton 6': {
                      type: 'button',
                      prevId: 'markdownRow 6',
                      pathId: 'B9yBNIH20bA+Yn1XrtdVKA==',
                      props: {
                        label: 'Button 6',
                      },
                    },
                    'markdownRow 10': {
                      type: 'markdown',
                      prevId: 'buttonButton 9',
                      props: {
                        source: 'Row 10',
                      },
                    },
                    'markdownRow 1': {
                      type: 'markdown',
                      props: {
                        source: 'Row 1',
                      },
                    },
                    'buttonButton 5': {
                      type: 'button',
                      prevId: 'markdownRow 5',
                      pathId: 'bmjOD7WbsPcdAGr86fb/jw==',
                      props: {
                        label: 'Button 5',
                      },
                    },
                    'markdownRow 6': {
                      type: 'markdown',
                      prevId: 'buttonButton 5',
                      props: {
                        source: 'Row 6',
                      },
                    },
                    lastId: 'buttonButton 10',
                    'buttonButton 9': {
                      type: 'button',
                      prevId: 'markdownRow 9',
                      pathId: 'C52qwoXeoUkl5YUKoU0ibw==',
                      props: {
                        label: 'Button 9',
                      },
                    },
                    'markdownRow 8': {
                      type: 'markdown',
                      prevId: 'buttonButton 7',
                      props: {
                        source: 'Row 8',
                      },
                    },
                    'buttonButton 8': {
                      type: 'button',
                      prevId: 'markdownRow 8',
                      pathId: '/DKiVgYvK7kGVO9WmfgEeg==',
                      props: {
                        label: 'Button 8',
                      },
                    },
                    'markdownRow 7': {
                      type: 'markdown',
                      prevId: 'buttonButton 6',
                      props: {
                        source: 'Row 7',
                      },
                    },
                    'buttonButton 3': {
                      type: 'button',
                      prevId: 'markdownRow 3',
                      pathId: 'wE91WwJM/uxlncEeaG/nXA==',
                      props: {
                        label: 'Button 3',
                      },
                    },
                    'markdownRow 2': {
                      type: 'markdown',
                      prevId: 'buttonButton 1',
                      props: {
                        source: 'Row 2',
                      },
                    },
                    'markdownRow 9': {
                      type: 'markdown',
                      prevId: 'buttonButton 8',
                      props: {
                        source: 'Row 9',
                      },
                    },
                    count: 20,
                    'buttonButton 10': {
                      type: 'button',
                      prevId: 'markdownRow 10',
                      pathId: 'NTG4C0s0bjqFN6eMunWLBw==',
                      props: {
                        label: 'Button 10',
                      },
                    },
                    'markdownRow 4': {
                      type: 'markdown',
                      prevId: 'buttonButton 3',
                      props: {
                        source: 'Row 4',
                      },
                    },
                  },
                  props: {
                    border: '1px solid white',
                    height: 150,
                    padding: 2,
                  },
                  pathId: 'eE7a6bwxqkSyXobc7+/RCw==',
                },
                lastId: 'scrollBoxscrollBox1',
                count: 1,
              },
            },
          },
        }
      : {},
    visible: DEBUG_PREPOPULATED,
  };

  state = Tools.initialState;

  componentDidMount() {
    window.addEventListener('CASTLE_TOOLS_UPDATE', this._handleUpdate);
    NativeUtil.sendLuaEvent('CASTLE_TOOLS_NEEDS_SYNC', {});
  }

  componentWillUnmount() {
    window.removeEventListener('CASTLE_TOOLS_UPDATE', this._handleUpdate);
  }

  _handleUpdate = (e) => {
    const diff = JSON.parse(e.params);
    // console.log(`diff: ${JSON.stringify(diff, null, 2)}`);

    const prevVisible = this.state.visible;
    this.setState(
      ({ root }) => {
        const newRoot = applyDiff(root, diff);
        const newVisible =
          newRoot.panes &&
          Object.values(newRoot.panes).find(
            (element) => element.children && element.children.count > 0
          );
        return { root: newRoot, visible: newVisible };
      },
      () => {
        if (prevVisible !== this.state.visible) {
          this.props.onLayoutChange && this.props.onLayoutChange();
        }
      }
    );
  };

  clearState() {
    this.setState(Tools.initialState);
  }

  render() {
    // console.log(`render: ${JSON.stringify(this.state.root, null, 2)}`);

    // NOTE(jim): this will take over the default render because
    // we don't need splitter layout anymore.

    let toolsElement = null;
    if (this.state.visible) {
      toolsElement = (
        <ToolsContext.Provider
          value={{
            transformAssetUri: this._transformAssetUri,
          }}>
          {Object.values(this.state.root.panes).map((element, i) => (
            <ToolPane key={(element.props && element.props.name) || i} element={element} />
          ))}
        </ToolsContext.Provider>
      );
    }

    return <div className={STYLES_CONTAINER_V2}>{toolsElement}</div>;
  }

  _transformAssetUri = (uri) => {
    let result = url.resolve(Utilities.getLuaEntryPoint(this.props.game), uri);
    if (!result) {
      return uri;
    }
    if (Utilities.isWindows()) {
      result = Utilities.fixWindowsFilePath(result);
    }
    return result;
  };
}
