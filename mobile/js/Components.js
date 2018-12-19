import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Nice container for things
export const Box = ({ style, ...rest }) => (
  <View
    style={{
      borderWidth: 1,
      borderColor: '#aaa',
      borderRadius: 4,
      padding: 4,
      marginTop: 6,
      ...style,
    }}
    {...rest}
  />
);

// Touchable container for things
export const Button = ({ style, ...rest }) => (
  <TouchableOpacity
    style={{
      backgroundColor: '#ddd',
      borderRadius: 4,
      padding: 4,
      alignItems: 'center',
      ...style,
    }}
    {...rest}
  />
);

// Better `Ionicons`!!
export const BetterIonicons = ({ style, ...rest }) => (
  <Ionicons style={{ margin: -3, marginTop: -2, ...style }} size={19} {...rest} />
);

// Common style for `TextInput`s
export const textInputStyle = {
  width: '100%',
  borderColor: '#ddd',
  borderRadius: 4,
  borderWidth: 1,
  padding: 4,
};
