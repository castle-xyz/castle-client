import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { getPaneData, sendDataPaneAction } from '../Tools';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Icon from 'react-native-vector-icons/MaterialIcons';

import SegmentedNavigation from '../SegmentedNavigation';
import * as Constants from '../Constants';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginTop: 4,
    borderRadius: 1000,
  },
  closeButton: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navigation: {
    borderBottomWidth: 1,
    borderBottomColor: Constants.colors.grayOnWhiteBorder,
  },
});

const makeChangeOrderOptions = ({ isTextActorSelected, sendAction }) => {
  if (isTextActorSelected) {
    return [
      {
        name: 'Move Down',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Move Up',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Move to Bottom',
        action: () => sendAction('moveSelectionToFront'),
      },
      {
        name: 'Move to Top',
        action: () => sendAction('moveSelectionToBack'),
      },
    ];
  } else {
    return [
      {
        name: 'Move Forward',
        action: () => sendAction('moveSelectionForward'),
      },
      {
        name: 'Move Backward',
        action: () => sendAction('moveSelectionBackward'),
      },
      {
        name: 'Move to Front',
        action: () => sendAction('moveSelectionToFront'),
      },
      {
        name: 'Move to Back',
        action: () => sendAction('moveSelectionToBack'),
      },
    ];
  }
};

export const SceneCreatorInspectorActions = ({ pane, visible, isTextActorSelected }) => {
  const { showActionSheetWithOptions } = useActionSheet();

  let data, sendAction;
  if (pane) {
    sendAction = (action, value) => sendDataPaneAction(pane, action, value);
    data = getPaneData(pane);
  }

  const changeSelectionOrder = React.useCallback(() => {
    const options = makeChangeOrderOptions({ isTextActorSelected, sendAction });
    showActionSheetWithOptions(
      {
        title: 'Change order',
        options: options.map((option) => option.name).concat(['Cancel']),
        cancelButtonIndex: options.length,
      },
      (buttonIndex) => {
        if (buttonIndex < options.length) {
          return options[buttonIndex].action();
        }
      }
    );
  }, [sendAction]);

  if (data) {
    let drawButton, scaleRotateButton, tabNavigation;
    let isDrawSelected = false;
    if (Array.isArray(data.applicableTools)) {
      const drawBehavior = data.applicableTools.find((behavior) => behavior.name === 'Draw');
      const grabBehavior = data.applicableTools.find((behavior) => behavior.name === 'Grab');
      const scaleRotateBehavior = data.applicableTools.find(
        (behavior) => behavior.name === 'ScaleRotate'
      );

      if (drawBehavior) {
        isDrawSelected = data.activeToolBehaviorId === drawBehavior.behaviorId;
        const onPress = () =>
          sendAction(
            'setActiveTool',
            isDrawSelected ? grabBehavior.behaviorId : drawBehavior.behaviorId
          );
        drawButton = (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDrawSelected ? '#000' : '#fff' }]}
            onPress={onPress}>
            <Icon name="edit" size={22} color={isDrawSelected ? '#fff' : '#000'} />
          </TouchableOpacity>
        );
      }

      if (scaleRotateBehavior) {
        const isScaleRotatedSelected = data.activeToolBehaviorId === scaleRotateBehavior.behaviorId;
        const onPress = () =>
          sendAction(
            'setActiveTool',
            isScaleRotatedSelected ? grabBehavior.behaviorId : scaleRotateBehavior.behaviorId
          );
        scaleRotateButton = (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: isScaleRotatedSelected ? '#000' : '#fff' },
            ]}
            onPress={onPress}>
            <Icon name="crop-rotate" size={22} color={isScaleRotatedSelected ? '#fff' : '#000'} />
          </TouchableOpacity>
        );
      }
    }

    /* TODO: BEN if (Array.isArray(data.inspectorTabs) && !isDrawSelected) {
      const items = data.inspectorTabs
        .filter((tab) => {
          // hide 'Movement' for text actors
          return !(isTextActorSelected && tab === 'movement');
        })
        .map((tab) => {
          return {
            name: tab.charAt(0).toUpperCase() + tab.slice(1),
            value: tab,
          };
        });
      tabNavigation = (
        <SegmentedNavigation
          items={items}
          selectedItem={items.find((i) => i.value === data.selectedInspectorTab)}
          onSelectItem={(item) => sendAction('setSelectedInspectorTab', item.value)}
          isLightBackground
        />
      );
    } */
    return (
      <View pointerEvents={visible ? 'auto' : 'none'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => sendAction('closeInspector')}>
            <Icon name="close" size={32} color="#000" />
          </TouchableOpacity>
          <View style={styles.actions}>
            {drawButton}
            {scaleRotateButton}
            <TouchableOpacity style={styles.actionButton} onPress={changeSelectionOrder}>
              <Icon name="layers" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => sendAction('duplicateSelection')}>
              <Icon name="content-copy" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => sendAction('deleteSelection')}>
              <Icon name="delete" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.navigation}>{tabNavigation}</View>
      </View>
    );
  }
  return null;
};
