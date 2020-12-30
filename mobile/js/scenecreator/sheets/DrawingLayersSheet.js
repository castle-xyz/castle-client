import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useFastDataMemo } from '../../ghost/GhostUI';
import { useActionSheet } from '@expo/react-native-action-sheet';
import _ from 'lodash';

import { BottomSheet } from '../../components/BottomSheet';

import FastImage from 'react-native-fast-image';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  header: {
    padding: 20,
    height: 64,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
  },
  headingLabel: {
    color: '#000',
    fontWeight: '500',
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
  },
  layerRow: {
    height: 64,
    flexDirection: 'row',
  },
  firstCell: {
    flexDirection: 'row',
    width: 150,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cell: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedCell: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  cellMenuButton: {
    position: 'absolute',
    backgroundColor: 'black',
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 5,
    width: 35,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const ICON_SIZE = 22;

const renderItem = ({ item, index, drag, isActive }) => {
  let layer = item;

  return (
    <View style={styles.layerRow}>
      <TouchableOpacity
        style={[
          styles.firstCell,
          {
            backgroundColor: isActive ? '#ccc' : 'transparent',
          },
        ]}
        onLongPress={drag}>
        <TouchableOpacity
          onPress={() =>
            item.fastAction('onSetLayerIsVisible', {
              layerId: layer.id,
              isVisible: !layer.isVisible,
            })
          }
          onLongPress={drag}>
          <MCIcon
            name={layer.isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={ICON_SIZE}
            color={'#000'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => item.fastAction('onSelectLayer', layer.id)}
          onLongPress={drag}>
          <Text style={layer.isSelected && { fontWeight: 'bold' }}>{layer.title}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => item.fastAction('onDeleteLayer', layer.id)}
          onLongPress={drag}>
          <Text>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      {layer.frames.map((frame, idx) => {
        let isSelected = layer.selectedFrame == idx + 1 && layer.isSelected;
        let isMenuAvailable = isSelected && idx > 0;
        let onPress = isMenuAvailable
          ? () =>
              layer.showCellActionSheet({
                isLinked: frame.isLinked,
                layerId: layer.id,
                frame: idx + 1,
              })
          : () =>
              item.fastAction('onSelectLayerAndFrame', {
                frame,
                layerId: layer.id,
                frame: idx + 1,
              });

        return (
          <TouchableOpacity
            onPress={onPress}
            onLongPress={drag}
            key={idx}
            style={isSelected ? styles.selectedCell : styles.cell}>
            {frame.isLinked ? (
              <MCIcon name="link-variant" size={ICON_SIZE} color={'#000'} />
            ) : (
              <FastImage
                source={{ uri: `data:image/png;base64,${frame.base64Png}` }}
                style={styles.image}
              />
            )}

            {isMenuAvailable && (
              <View style={styles.cellMenuButton}>
                <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const DrawingLayers = useFastDataMemo('draw-layers', ({ fastData, fastAction }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const [stateLayers, setStateLayers] = React.useState([]);

  // we need to pass stateSeletedLayerId into extraData instead of fastData.selectedLayerId because
  // otherwise extraData will trigger the FlatList update before stateLayers gets updated
  const [stateSeletedLayerId, setStateSelectedLayerId] = React.useState(null);
  const [stateSelectedFrame, setStateSelectedFrame] = React.useState(1);

  const showCellActionSheet = useCallback((args) => {
    let options = [
      {
        name: args.isLinked ? 'Unlink' : 'Link',
        action: () => {
          fastAction('onSetCellLinked', {
            frame: args.frame,
            layerId: args.layerId,
            isLinked: !args.isLinked,
          });
        },
      },
    ];

    showActionSheetWithOptions(
      {
        title: 'Cell Options',
        options: options.map((option) => option.name).concat(['Cancel']),
        cancelButtonIndex: options.length,
      },
      (buttonIndex) => {
        if (buttonIndex < options.length) {
          return options[buttonIndex].action();
        }
      }
    );
  }, []);

  useEffect(() => {
    if (fastData.layers) {
      let newLayers = JSON.parse(JSON.stringify(fastData.layers));
      if (!Array.isArray(newLayers)) {
        newLayers = Object.values(newLayers);
      }

      newLayers.sort((a, b) => b.order - a.order);

      for (let i = 0; i < newLayers.length; i++) {
        let layer = newLayers[i];
        layer.isSelected = layer.id === fastData.selectedLayerId;
        layer.fastAction = fastAction;
        layer.showCellActionSheet = showCellActionSheet;
        layer.selectedFrame = fastData.selectedFrame;

        if (!Array.isArray(layer.frames)) {
          layer.frames = Object.values(layer.frames);
        }

        layer.frames.sort((a, b) => a.order - b.order);
      }

      setStateLayers(newLayers);
    }
  }, [fastData]);

  useEffect(() => {
    setStateSelectedLayerId(fastData.selectedLayerId);
  }, [fastData.selectedLayerId]);

  useEffect(() => {
    setStateSelectedFrame(fastData.selectedFrame);
  }, [fastData.selectedFrame]);

  const onAddLayer = useCallback(() => fastAction('onAddLayer'), []);
  const onAddFrame = useCallback(() => fastAction('onAddFrame'), []);
  const keyExtractor = useCallback((item) => item.id, []);
  const onDragEnd = useCallback(({ data }) => {
    setStateLayers(data);
    fastAction('onReorderLayers', data.map((layer) => layer.id));
  }, []);
  const showFrameActionSheet = useCallback((frame) => {
    let options = [
      {
        name: 'Delete Frame',
        action: () => {
          fastAction('onDeleteFrame', frame);
        },
      },
      {
        name: 'Add Frame After',
        action: () => {
          fastAction('onAddFrameAtPosition', frame);
        },
      },
    ];

    showActionSheetWithOptions(
      {
        title: 'Frame Options',
        options: options.map((option) => option.name).concat(['Cancel']),
        cancelButtonIndex: options.length,
      },
      (buttonIndex) => {
        if (buttonIndex < options.length) {
          return options[buttonIndex].action();
        }
      }
    );
  }, []);

  return (
    <ScrollView horizontal>
      <View style={{ flex: 1 }}>
        <View style={styles.layerRow}>
          <TouchableOpacity onPress={onAddLayer} style={styles.firstCell}>
            <Text>+ Add Layer</Text>
          </TouchableOpacity>
          {stateLayers.length > 0 &&
            stateLayers[0].frames.map((frame, idx) => {
              let isSelected = stateSelectedFrame == idx + 1;
              let onPress = isSelected
                ? () => showFrameActionSheet(idx + 1)
                : () => fastAction('onSelectFrame', idx + 1);

              return (
                <TouchableOpacity onPress={onPress} style={styles.cell} key={idx}>
                  <Text style={isSelected && { fontWeight: 'bold' }}>{idx + 1}</Text>

                  {isSelected && (
                    <View style={styles.cellMenuButton}>
                      <MCIcon name={'dots-horizontal'} size={ICON_SIZE} color={'#fff'} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          <TouchableOpacity onPress={onAddFrame} style={styles.cell}>
            <Text>+</Text>
          </TouchableOpacity>
        </View>
        <DraggableFlatList
          data={stateLayers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onDragEnd={onDragEnd}
          extraData={stateSeletedLayerId}
        />
      </View>
    </ScrollView>
  );
});

export const DrawingLayersSheet = ({ onClose, ...props }) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headingLabel}>Layers</Text>
      </View>
      <View>
        <MCIcon name="play" size={ICON_SIZE} color={'#000'} />
      </View>
    </View>
  );

  const renderContent = () => <DrawingLayers style={{ flex: 1 }} />;

  return (
    <BottomSheet
      useViewInsteadOfScrollview
      renderContent={renderContent}
      renderHeader={renderHeader}
      style={styles.container}
      {...props}
    />
  );
};
