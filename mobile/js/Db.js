// Common utility functions / references for Firestore access

import firebase from 'react-native-firebase';

const db = firebase.firestore();

// Uids

export const currentUid = () => {
  const currentUser = firebase.auth().currentUser;
  if (!(currentUser && currentUser.uid)) {
    throw new Error('not signed in');
  }
  return currentUser.uid;
};

// Profiles

export const profiles = db.collection('profiles');

export const currentProfile = () => profiles.doc(currentUid());

// Posts

export const posts = db.collection('posts');
