import * as React from 'react';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import { css } from 'react-emotion';
import {
  Grommet,
  Box,
  Heading,
  Markdown,
  Paragraph,
  Text,
  Button,
  TextInput,
  Accordion,
  AccordionPanel,
  Tabs,
  Tab,
  CheckBox,
  MaskedInput,
  RadioButton,
  RangeInput,
  Select,
  TextArea,
} from 'grommet';

import Logs from '~/common/logs';
import NewWindow from 'react-new-window';

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

class ToolBox extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <Box {...element.props}>{renderChildren(element)}</Box>;
  }
}
elementTypes['box'] = ToolBox;

class ToolHeading extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <Heading {...element.props}>{element.props.text}</Heading>;
  }
}
elementTypes['heading'] = ToolHeading;

class ToolMarkdown extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <Markdown {...element.props}>{element.props.text}</Markdown>;
  }
}
elementTypes['markdown'] = ToolMarkdown;

class ToolParagraph extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <Paragraph {...element.props}>{element.props.text}</Paragraph>;
  }
}
elementTypes['paragraph'] = ToolParagraph;

class ToolText extends React.PureComponent {
  render() {
    const { element } = this.props;
    return <Text {...element.props}>{element.props.text}</Text>;
  }
}
elementTypes['text'] = ToolText;

class ToolSection extends React.PureComponent {
  render() {
    const { element } = this.props;
    return (
      <Accordion
        animate={false}
        activeIndex={element.active ? [0] : []}
        onActive={(arr) => sendEvent(element.pathId, { type: 'onActive', value: arr.length > 0 })}>
        <AccordionPanel {...element.props}>
          <Box pad={{ left: 'small', top: 'small', bottom: 'small' }}>
            {renderChildren(element)}
          </Box>
        </AccordionPanel>
      </Accordion>
    );
  }
}
elementTypes['section'] = ToolSection;

class ToolButton extends React.PureComponent {
  render() {
    const { element } = this.props;
    return (
      <Button {...element.props} onClick={() => sendEvent(element.pathId, { type: 'onClick' })} />
    );
  }
}
elementTypes['button'] = ToolButton;

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
      <Tabs
        {...element.props}
        onActive={(activeIndex) =>
          children.forEach(({ id, child }, childIndex) =>
            sendEvent(child.pathId, { type: 'onActive', value: childIndex === activeIndex })
          )
        }>
        {children.map(({ id, child }) => (
          <Tab key={id} {...child.props}>
            {renderChildren(child)}
          </Tab>
        ))}
      </Tabs>
    );
  }
}
elementTypes['tabs'] = ToolTabs;

class ToolCheckBox extends React.PureComponent {
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
      <CheckBox
        {...element.props}
        checked={this.state.checked}
        onChange={(event) => {
          this.setState({
            checked: event.target.checked,
            lastSentEventId: sendEvent(element.pathId, {
              type: 'onChange',
              checked: event.target.checked,
            }),
          });
        }}
      />
    );
  }
}
elementTypes['checkBox'] = ToolCheckBox;

class ToolMaskedInput extends React.PureComponent {
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
      <MaskedInput
        {...element.props}
        mask={
          Array.isArray(element.props.mask)
            ? element.props.mask.map((o) => (o.regexp ? { ...o, regexp: new RegExp(o.regexp) } : o))
            : element.props.mask
        }
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
    );
  }
}
elementTypes['maskedInput'] = ToolMaskedInput;

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
    return (
      <Box gap="small" {...element.props}>
        {element.props && element.props.options
          ? element.props.options.map((option, i) => (
              <RadioButton
                key={i}
                name={element.pathId}
                label={option}
                checked={this.state.value === option}
                onChange={(event) => {
                  if (event.target.checked) {
                    this.setState({
                      value: option,
                      lastSentEventId: sendEvent(element.pathId, {
                        type: 'onChange',
                        value: option,
                      }),
                    });
                  }
                }}
              />
            ))
          : null}
      </Box>
    );
  }
}
elementTypes['radioButtonGroup'] = ToolRadioButtonGroup;

class ToolRangeInput extends React.PureComponent {
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
      <RangeInput
        {...element.props}
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
    );
  }
}
elementTypes['rangeInput'] = ToolRangeInput;

class ToolSelect extends React.PureComponent {
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
      <Select
        {...element.props}
        value={this.state.value}
        onChange={({ option }) => {
          this.setState({
            value: option,
            lastSentEventId: sendEvent(element.pathId, {
              type: 'onChange',
              value: option,
            }),
          });
        }}
      />
    );
  }
}
elementTypes['select'] = ToolSelect;

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
      <TextInput
        {...element.props}
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
    );
  }
}
elementTypes['textInput'] = ToolTextInput;

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
      <TextArea
        style={{ height: 150 }}
        resize="vertical"
        {...element.props}
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
    );
  }
}
elementTypes['textArea'] = ToolTextArea;

class ToolPane extends React.PureComponent {
  render() {
    const { element } = this.props;
    return (
      <Box pad="small" {...element.props}>
        {renderChildren(element)}
      </Box>
    );
  }
}
elementTypes['pane'] = ToolPane;

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

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;

  background-color: ${Constants.toolsTheme.global.colors.background};
  border-left: 1px solid ${Constants.colors.background4};

  overflow-y: scroll;

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

export default class Tools extends React.PureComponent {
  static initialState = {
    root: {},
    visible: false,
  };

  state = Tools.initialState;

  componentDidMount() {
    window.addEventListener('CASTLE_TOOLS_UPDATE', this._handleUpdate);
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

    return this.state.visible ? (
      <NewWindow
        features={{ titlebar: 'no', dependent: 'yes', width: '600px', height: '640px' }}>
        <div className={STYLES_CONTAINER}>
          <Grommet theme={Constants.toolsTheme}>
            {Object.values(this.state.root.panes).map((element, i) => (
              <ToolPane key={(element.props && element.props.name) || i} element={element} />
            ))}
          </Grommet>
        </div>
      </NewWindow>
    ) : null;
  }
}
