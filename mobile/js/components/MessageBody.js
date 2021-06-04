import React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';

const defaultStyles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 19,
  },
  highlight: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 19,
  },
});

const BodyToken = ({ styles, token, navigateToUser, navigateToAllUsers }) => {
  if (token.text) {
    if (token.usersList) {
      return (
        <TouchableWithoutFeedback onPress={navigateToAllUsers}>
          <Text style={styles.highlight}>{token.text}</Text>
        </TouchableWithoutFeedback>
      );
    }
    return <Text style={styles.text}>{token.text}</Text>;
  }
  if (token.userId) {
    return (
      <TouchableWithoutFeedback onPress={() => navigateToUser(token)}>
        <Text style={styles.highlight}>{token.username}</Text>
      </TouchableWithoutFeedback>
    );
  }
  return null;
};

export const MessageBody = ({
  body,
  styles = defaultStyles,
  navigateToUser,
  navigateToAllUsers,
}) => {
  if (!body?.message) {
    return null;
  }
  return (
    <Text>
      {body.message.map((token, ii) => (
        <BodyToken
          key={`token-${ii}`}
          token={token}
          navigateToUser={navigateToUser}
          navigateToAllUsers={navigateToAllUsers}
          styles={styles}
        />
      ))}
    </Text>
  );
};
