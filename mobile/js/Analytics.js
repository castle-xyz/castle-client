// Focal point for all analytics stuff -- this way we can keep track of event names and metadata

import firebase from 'react-native-firebase';

const analytics = firebase.analytics();

export const visitScreen = (screenName) => {
  analytics.setCurrentScreen(screenName, screenName);
};

export const newPost = () => {
  analytics.logEvent('new_post');
};

export const useCodeBrush = ({ codeBlabId }) => {
  analytics.logEvent('use_code_brush', { codeBlabId });
};

export const browseUser = () => {
  analytics.logEvent('browse_user');
};
