import * as React from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, View, Keyboard } from 'react-native';

import { BottomSheetHeader } from '../components/BottomSheetHeader';
import { BottomSheet } from '../components/BottomSheet';
import { CommentInput } from './CommentInput';
import { CommentsList } from './CommentsList';
import { formatMessage } from '../common/chat-utilities';
import { gql, useMutation } from '@apollo/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '../common/utilities';
import { useNavigation } from '../ReactNavigation';
import { useSession } from '../Session';

import * as Constants from '../Constants';

import Viewport from '../common/viewport';

const TAB_BAR_HEIGHT = 49;
const SHEET_HEADER_HEIGHT = 62;

const needsTabBarPadding = ({ navigationIndex }) => {
  return Constants.iOS && navigationIndex === 0;
};

const needsTabBarHeight = ({ isFullScreen }) => {
  return Constants.Android && !isFullScreen;
};

export const CommentsSheet = ({ isOpen, onClose, deck, isFullScreen, ...props }) => {
  const { dangerouslyGetState } = useNavigation();
  const { isAnonymous } = useSession();

  const insets = useSafeAreaInsets();
  const navigationIndex = dangerouslyGetState().index;
  const maxSheetHeight =
    Viewport.vh * 100 -
    insets.top -
    Constants.FEED_HEADER_HEIGHT -
    (needsTabBarHeight({ isFullScreen }) ? TAB_BAR_HEIGHT : 0);

  const closeSheet = React.useCallback(() => {
    Keyboard.dismiss();
    return onClose();
  }, [onClose]);
  const renderHeader = () => <BottomSheetHeader title="Comments" onClose={closeSheet} />;

  const [replyingToComment, setReplyingToComment] = React.useState();

  const [addComment] = useMutation(
    gql`
      mutation ($deckId: ID!, $message: String!, $parentCommentId: ID) {
        addDeckComment(deckId: $deckId, message: $message, parentCommentId: $parentCommentId) {
          ${Constants.COMMENTS_LIST_FRAGMENT}
        }
      }
    `,
    {
      update: (cache, { data }) => {
        // https://www.apollographql.com/docs/react/caching/cache-interaction/#example-updating-the-cache-after-a-mutation
        cache.modify({
          id: cache.identify(deck),
          fields: {
            comments(_, { DELETE }) {
              const newCommentsList = data.addDeckComment;
              const newCommentsListRef = cache.writeFragment({
                data: newCommentsList,
                fragment: gql`
                  fragment NewCommentsList on CommentsList {
                    threadId
                    count
                  }
                `,
              });
              return newCommentsListRef;
            },
          },
        });
      },
    }
  );

  const onAddComment = React.useCallback(
    (message, parentCommentId = null, commentBodyCache = {}) => {
      const formattedMessage = formatMessage(message, commentBodyCache);
      return addComment({
        variables: {
          deckId: deck.deckId,
          message: formattedMessage,
          parentCommentId,
        },
      });
    },
    [addComment, deck]
  );

  let paddingBottomIOS = 0;
  if (needsTabBarPadding({ navigationIndex })) {
    paddingBottomIOS += TAB_BAR_HEIGHT;
  }

  const renderContentInner = () => (
    <>
      <CommentsList
        isOpen={isOpen}
        deck={deck}
        setReplyingToComment={setReplyingToComment}
        {...props}
      />
      {!isAnonymous && isOpen && deck?.commentsEnabled ? (
        <CommentInput
          onAddComment={onAddComment}
          replyingToComment={replyingToComment}
          clearReplyingToComment={() => setReplyingToComment(undefined)}
        />
      ) : null}
    </>
  );

  const renderContent = Constants.Android
    ? () => <View style={{ flex: 1 }}>{renderContentInner()}</View>
    : () => (
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            keyboardVerticalOffset={Viewport.vh * 100 - maxSheetHeight + SHEET_HEADER_HEIGHT}
            behavior="padding"
            style={{ flex: 1 }}>
            {renderContentInner()}
          </KeyboardAvoidingView>
          <View style={{ height: paddingBottomIOS }} />
        </View>
      );

  return (
    <BottomSheet
      isFullScreen={isFullScreen}
      useViewInsteadOfScrollview
      snapPoints={[maxSheetHeight]}
      isOpen={isOpen}
      renderHeader={renderHeader}
      renderContent={renderContent}
      onOpenEnd={Keyboard.dismiss}
      onCloseEnd={Keyboard.dismiss}
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
        borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
        ...Constants.styles.dropShadowUp,
      }}
    />
  );
};
