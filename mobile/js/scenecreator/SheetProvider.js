import * as React from 'react';
import { BlueprintsSheet } from './sheets/BlueprintsSheet';
import { NewBlueprintSheet } from './sheets/NewBlueprintSheet';
import { CapturePreviewSheet } from './sheets/CapturePreviewSheet';
import { CardToolsSheet } from './sheets/CardToolsSheet';
import { CreateCardSettingsSheet } from './sheets/CreateCardSettingsSheet';
import { InspectorSheet } from './inspector/InspectorSheet';
import { InstanceSheet } from './inspector/instance/InstanceSheet';
import { DrawingLayersSheet } from './sheets/DrawingLayersSheet';
import { SheetBackgroundOverlay } from '../components/SheetBackgroundOverlay';
import { useCardCreator } from './CreateCardContext';
import { useGhostUI } from '../ghost/GhostUI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Viewport from '../common/viewport';

import { CARD_HEADER_HEIGHT } from './CreateCardHeader';
const FULL_SHEET_HEIGHT = 100 * Viewport.vh - CARD_HEADER_HEIGHT;

const ROOT_SHEETS = [
  {
    key: 'sceneCreatorNewBlueprint',
    Component: NewBlueprintSheet,
    makeSnapPoints: ({ insets }) => [FULL_SHEET_HEIGHT * 0.75, FULL_SHEET_HEIGHT - insets.top],
  },
  {
    key: 'sceneCreatorBlueprints',
    Component: BlueprintsSheet,
  },
  {
    key: 'sceneCreatorInstance',
    Component: InstanceSheet,
  },
  {
    key: 'sceneCreatorInspector',
    Component: InspectorSheet,
  },
  {
    key: 'variables',
    Component: CardToolsSheet,
    makeSnapPoints: ({ insets }) => [FULL_SHEET_HEIGHT * 0.65, FULL_SHEET_HEIGHT - insets.top],
  },
  {
    key: 'sceneCreatorSettings',
    Component: CreateCardSettingsSheet,
    snapPoints: [FULL_SHEET_HEIGHT * 0.6],
  },
  {
    key: 'capturePreview',
    Component: CapturePreviewSheet,
    makeSnapPoints: ({ insets }) => [FULL_SHEET_HEIGHT - insets.top],
  },
  {
    key: 'drawingLayers',
    Component: DrawingLayersSheet,
    makeSnapPoints: ({ insets }) => [90, 350, Viewport.vh * 100 - insets.top - 48],
  },
];

// root sheets can have a stack of child sheets
const sheetStackReducer = (prevStacks, action) => {
  let result = { ...prevStacks };
  switch (action.type) {
    case 'push': {
      const { key, sheet } = action;
      if (!result[key]) {
        result[key] = [ROOT_SHEETS.find((sheet) => sheet.key === key)];
      }
      result[key] = result[key].concat([sheet]);
      break;
    }
    case 'pop': {
      const { key } = action;
      if (!result[key] || result[key].length < 2) {
        throw new Error(`Tried to pop root sheet or nonexistent sheet`);
      }
      // TODO: animate out
      result[key] = result[key].slice(0, -1);
      break;
    }
    default:
      throw new Error(`Unrecognized sheet stack action: ${action.type}`);
  }
  return result;
};

export const SheetProvider = ({ activeSheet, setActiveSheet, isShowingDraw, beltHeight }) => {
  const { root } = useGhostUI();
  const { isPlaying, hasSelection, isBlueprintSelected } = useCardCreator();
  const insets = useSafeAreaInsets();

  const [sheetStacks, updateSheetStacks] = React.useReducer(sheetStackReducer, {});
  const closeRootSheet = () => setActiveSheet(null);

  return (
    <React.Fragment>
      {ROOT_SHEETS.map((sheet, ii) => {
        const { key } = sheet;
        let isOpen = false;

        // all sheets are closed when playing
        if (!isPlaying) {
          if (activeSheet) {
            isOpen = key === activeSheet;
          }
          if (isShowingDraw) {
            isOpen = key === 'drawingLayers';
          }
        }

        const stack = sheetStacks[key] ?? [sheet];
        const addChildSheet = (sheet) => updateSheetStacks({ type: 'push', key, sheet });
        const closeChildSheet = () => updateSheetStacks({ type: 'pop', key });

        return stack.map((sheet, stackIndex) => {
          let { key, Component, ...sheetProps } = sheet;

          const closeLastSheet = stackIndex == 0 ? closeRootSheet : closeChildSheet;
          const maybeOverlay =
            stackIndex == 0 ? null : <SheetBackgroundOverlay onPress={closeLastSheet} />;

          // some sheets are provided by Ghost ToolUI elements.
          const ghostPaneElement = root?.panes ? root.panes[key] : null;

          sheetProps = {
            ...sheetProps,
            isOpen,
            addChildSheet,
            onClose: closeLastSheet,
            element: ghostPaneElement,
            snapPoints: sheetProps.makeSnapPoints
              ? sheetProps.makeSnapPoints({ insets })
              : sheetProps.snapPoints,
            beltHeight,
          };

          return (
            <React.Fragment key={key}>
              {maybeOverlay}
              <Component {...sheetProps} />
            </React.Fragment>
          );
        });
      })}
    </React.Fragment>
  );
};
