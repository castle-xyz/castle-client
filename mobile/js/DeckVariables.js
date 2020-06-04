import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Ionicon from 'react-native-vector-icons/Ionicons';
import uuid from 'uuid/v4';

import * as Constants from './Constants';

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  variableInputContainer: {
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variablePrefix: {
    color: '#bbb',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    paddingRight: 4,
    flexGrow: 0,
  },
  variableType: {
    color: '#bbb',
    fontSize: 16,
    lineHeight: 20,
  },
  variableName: {
    flexGrow: 1,
  },
  input: {
    color: '#000',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    width: '33%',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    color: '#888',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    ...Constants.styles.plainButton,
    backgroundColor: '#000',
  },
  buttonLabel: {
    paddingHorizontal: 8,
    ...Constants.styles.plainButtonLabel,
    color: '#fff',
  },
});

const EMPTY_VARIABLE = {
  id: 0,
  name: '',
  type: 'number',
  initialValue: 0,
  value: 0,
};

const maybeParseInt = (value) => {
  const result = parseInt(value);
  return isNaN(result) ? 0 : result;
};

const VariableInput = ({ name, type, autoFocus, onChange, onDelete, ...props }) => {
  const nameInputProps = {
    ...props,
    autoFocus,
    value: name,
  };
  const valueInputProps = {
    ...props,
    value: props.initialValue?.toString(),
  };
  return (
    <View style={styles.variableInputContainer}>
      <View style={{ flexDirection: 'row', width: '32%' }}>
        <Text style={styles.variablePrefix}>$</Text>
        <TextInput
          style={[styles.input, styles.variableName]}
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCompleteType="off"
          autoCorrect={false}
          onChangeText={(name) => onChange({ name })}
          {...nameInputProps}
        />
      </View>
      <Text style={[styles.variableType, { width: '32%' }]}>{type}</Text>
      <TextInput
        style={[styles.input, { width: '32%' }]}
        placeholderTextColor="#666"
        autoCompleteType="off"
        autoCorrect={false}
        keyboardType="number-pad"
        onChangeText={(value) => onChange({ initialValue: maybeParseInt(value) })}
        {...valueInputProps}
      />
      <View style={{ width: '4%' }}>
        <TouchableOpacity onPress={onDelete}>
          <Ionicon name="md-trash" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DeckVariables = ({ variables, onChange }) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const onChangeVariable = React.useCallback(
    (changes, index) =>
      onChange(
        variables.map((variable, ii) => (ii == index ? { ...variable, ...changes } : variable))
      ),
    [variables, onChange]
  );
  const addVariable = React.useCallback(() => {
    const existing = variables && variables.length ? variables : [];
    return onChange([{ ...EMPTY_VARIABLE, id: uuid() }].concat(existing));
  }, [variables, onChange]);
  const deleteVariable = React.useCallback(
    (index) =>
      showActionSheetWithOptions(
        {
          title: `Delete variable "${variables[index].name}"?`,
          options: ['Delete', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            onChange(variables.filter((variable, ii) => ii !== index));
          }
        }
      ),
    [variables, onChange]
  );

  return (
    <View style={styles.content}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={addVariable}>
          <Text style={styles.buttonLabel}>Add new variable</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { width: '32%' }]}>Name</Text>
        <Text style={[styles.label, { width: '32%' }]}>Type</Text>
        <Text style={[styles.label, { width: '36%' }]}>Initial Value</Text>
      </View>
      {variables &&
        variables.map((variable, ii) => (
          <VariableInput
            key={`var-${ii}-${variable.id}`}
            autoFocus={ii === 0 && variable.name.length === 0}
            onChange={(changes) => onChangeVariable(changes, ii)}
            onDelete={() => deleteVariable(ii)}
            {...variable}
          />
        ))}
    </View>
  );
};

export default DeckVariables;
