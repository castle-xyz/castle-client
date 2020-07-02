import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOptimisticBehaviorValue } from '../InspectorUtilities';
import { InspectorCheckbox } from '../components/InspectorCheckbox';
import { useGhostUI } from '../../../ghost/GhostUI';
import { sendDataPaneAction } from '../../../Tools';

import RulePartPickerSheet from './rules/RulePartPickerSheet';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  addButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#000',
    borderRadius: 3,
    padding: 8,
  },
  addLabel: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    paddingBottom: 16,
  },
  rule: {
    marginBottom: 16,
  },
  ruleName: {
    marginBottom: 8,
  },
  response: {
    paddingBottom: 8,
  },
  nextResponse: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  insetContainer: {
    paddingTop: 16,
    paddingLeft: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopLeftRadius: 6,
    borderColor: '#ccc',
  },
});

const InspectorTrigger = ({ trigger, behaviors, addChildSheet, triggers, onChangeTrigger }) => {
  if (!trigger) {
    return null;
  }

  const onPickTrigger = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: triggers,
      onSelectEntry: onChangeTrigger,
      title: 'Select trigger',
    });

  let label;
  // TODO: implement components to handle different trigger UIs here.
  switch (trigger.name) {
    case 'collide':
      {
        if (trigger.params.tag) {
          label = `When this collides with tag: ${trigger.params.tag}`;
        } else {
          label = `When this collides`;
        }
      }
      break;
    case 'variable reaches value': {
      label = `When variable ${trigger.params.variableId} is ${trigger.params.comparison}: ${trigger.params.value}`;
      break;
    }
    default:
      label = `When: ${trigger.name}, params: ${JSON.stringify(trigger.params, null, 2)}`;
  }

  return (
    <TouchableOpacity onPress={onPickTrigger}>
      <Text style={styles.ruleName}>{label}</Text>
    </TouchableOpacity>
  );
};

const InspectorResponse = ({ response, order = 0, ...props }) => {
  if (!response) {
    return null;
  }
  const { addChildSheet, behaviors, responses, onChangeResponse } = props;

  const onPickResponse = () =>
    addChildSheet({
      key: 'rulePartPicker',
      Component: RulePartPickerSheet,
      behaviors,
      entries: responses,
      onSelectEntry: onChangeResponse,
      title: 'Select response',
    });

  let responseContents;
  // TODO: implement components to handle different response UIs here.
  switch (response.name) {
    case 'if': {
      responseContents = (
        <React.Fragment>
          <Text style={styles.ruleName}>
            If: {response.params.condition?.name}{' '}
            {JSON.stringify(response.params.condition?.params)}
          </Text>
          <View style={styles.insetContainer}>
            <InspectorResponse response={response.params.then ?? {}} {...props} />
          </View>
        </React.Fragment>
      );
      break;
    }
    case 'repeat': {
      responseContents = (
        <React.Fragment>
          <Text style={styles.ruleName}>Repeat {response.params?.count ?? 0} times</Text>
          <View style={styles.insetContainer}>
            <InspectorResponse response={response.params.body ?? {}} {...props} />
          </View>
        </React.Fragment>
      );
      break;
    }
    case 'act on other': {
      responseContents = (
        <React.Fragment>
          <Text style={styles.ruleName}>Act on other</Text>
          <View style={styles.insetContainer}>
            <InspectorResponse response={response.params.body ?? {}} {...props} />
          </View>
        </React.Fragment>
      );
      break;
    }
    default: {
      let paramsToRender = { ...response.params };
      delete paramsToRender.nextResponse;
      responseContents = (
        <TouchableOpacity onPress={onPickResponse}>
          <Text>
            {response.name}: {JSON.stringify(paramsToRender, null, 2)}
          </Text>
        </TouchableOpacity>
      );
      break;
    }
  }

  return (
    <React.Fragment>
      <View style={[styles.response, order > 0 ? styles.nextResponse : null]}>
        {responseContents}
      </View>
      <InspectorResponse response={response.params?.nextResponse} order={order + 1} {...props} />
    </React.Fragment>
  );
};

const InspectorRule = ({ rule, behaviors, triggers, responses, addChildSheet, onChangeRule }) => {
  const onChangeTrigger = React.useCallback(
    (entry) => {
      return onChangeRule({
        ...rule,
        trigger: {
          name: entry.name,
          behaviorId: entry.behaviorId,
          params: entry.initialParams ?? {},
        },
      });
    },
    [onChangeRule]
  );

  const onChangeResponse = React.useCallback(
    (entry) => {
      return onChangeRule({
        ...rule,
        response: {
          name: entry.name,
          behaviorId: entry.behaviorId,
          params: entry.initialParams ?? {},
        },
      });
    },
    [onChangeRule]
  );

  return (
    <View style={styles.rule}>
      <InspectorTrigger
        trigger={rule.trigger}
        behaviors={behaviors}
        addChildSheet={addChildSheet}
        triggers={triggers}
        onChangeTrigger={onChangeTrigger}
      />
      <View style={styles.insetContainer}>
        <InspectorResponse
          response={rule.response}
          behaviors={behaviors}
          addChildSheet={addChildSheet}
          responses={responses}
          onChangeResponse={onChangeResponse}
        />
      </View>
    </View>
  );
};

export default InspectorRules = ({ behaviors, sendAction, addChildSheet }) => {
  const rules = behaviors.Rules;

  // TODO: would be nice not to subscribe here
  const { root } = useGhostUI();
  const element = root?.panes ? root.panes['sceneCreatorRules'] : null;

  let rulesData, sendRuleAction;
  if (element.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        const data = child.props.data;
        if (data.name === 'Rules') {
          rulesData = data;
        }
        sendRuleAction = (action, value) => sendDataPaneAction(element, action, value, key);
      }
    });
  }

  let rulesItems = [];
  if (rulesData) {
    // there's an issue with the lua bridge applying a diff to arrays
    // where we can either get an array here, or we can get an object with keys
    // like "0", "2", ...
    if (Array.isArray(rulesData.rules)) {
      rulesItems = rulesData.rules.map((rule, ii) => ({ ...rule, index: ii + 1 }));
    } else {
      rulesItems = Object.entries(rulesData.rules)
        .map(([index, rule]) => ({ ...rule, index }))
        .sort((a, b) => parseInt(b.index, 10) < parseInt(a.index, 10));
    }
  }

  const onChangeRule = React.useCallback(
    (newRule) => {
      const newRules = rulesItems.map((oldRule) => {
        return oldRule.index === newRule.index ? newRule : oldRule;
      });
      sendRuleAction('change', newRules);
    },
    [rulesItems, sendRuleAction]
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => sendRuleAction('add')}>
          <Text style={styles.addLabel}>Add new rule</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Rules (read only)</Text>
      <React.Fragment>
        {rulesItems.map((rule, ii) => (
          <InspectorRule
            key={`rule-${rule.trigger?.name}-${rule.response?.name}-${ii}`}
            rule={rule}
            onChangeRule={onChangeRule}
            behaviors={behaviors}
            addChildSheet={addChildSheet}
            triggers={rulesData.triggers}
            responses={rulesData.responses}
          />
        ))}
      </React.Fragment>
    </View>
  );
};
