import { AppLoading } from 'expo';
import React from 'react';
import { Text, Alert, KeyboardAvoidingView, View, TextInput } from 'react-native';
import firebase from 'react-native-firebase';
import PhoneInput from 'react-native-phone-input';
import { withNavigationFocus } from 'react-navigation';
import debounce from 'lodash.debounce';

import { Box, Button } from './Components';
import * as Db from './Db';

// Load saved authorization state and navigate to the appropriate initial screen. Also causes
// re-navigation when the authorization state changes later.
export class AuthLoadingScreen extends React.Component {
  constructor(props, context) {
    super(props, context);
    this._init();
  }

  async _init() {
    firebase.auth().onAuthStateChanged(async user => {
      this._removeProfileSubscription && this._removeProfileSubscription();

      // No auth'd user? Sign in!
      if (!user) {
        this.props.navigation.navigate('AuthScreen');
        return;
      }

      // Legacy anonymous user? Sign out.
      if (user.isAnonymous) {
        firebase.auth().signOut();
        return;
      }

      // Cross-reference with analytics
      firebase.analytics().setUserId(user.uid);

      this._removeProfileSubscription = Db.profiles.doc(user.uid).onSnapshot(snapshot => {
        // No profile or no username? Make one!
        if (!snapshot.exists || !snapshot.data().username) {
          this.props.navigation.navigate('NewProfileScreen');
          return;
        }

        // All good, proceed to the main app!
        this.props.navigation.navigate('AppNavigator');
      });
    });
  }

  render() {
    return <AppLoading />;
  }
}

// Present a 'sign in' flow
@withNavigationFocus
export class AuthScreen extends React.Component {
  static initialState = {
    phoneNumber: null, // Phone number value while entering it
    phoneNumberSubmitted: false, // Whether submitted to Firebase
    confirmationResult: null, // Result from submitting phone number, used with confirmation code
    confirmationCode: null, // Confirmation code value while entering it
    confirmationCodeSubmitted: false, // Whether submitted to Firebase
  };

  state = AuthScreen.initialState;

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', padding: 10 }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {!this.state.phoneNumberSubmitted ? (
            <View>
              <Box>
                <Text>
                  Welcome to brushy! Enter your phone number below to get a confirmation code and
                  sign in. Your phone number will remain private.
                </Text>
              </Box>

              <Box>
                <PhoneInput
                  textStyle={{ fontSize: 24 }}
                  ref={ref => this.props.isFocused && ref && ref.focus()}
                  onChangePhoneNumber={phoneNumber => this.setState({ phoneNumber })}
                />
                <Button style={{ marginTop: 6 }} onPress={this._onSubmitPhoneNumber.bind(this)}>
                  <Text>submit</Text>
                </Button>
              </Box>
            </View>
          ) : null}

          {this.state.phoneNumberSubmitted && !this.state.confirmationResult ? (
            <Box>
              <Text>Verifying phone number...</Text>
            </Box>
          ) : null}

          {this.state.confirmationResult && !this.state.confirmationCodeSubmitted ? (
            <View>
              <Box>
                <Text>
                  Check your text messages for a confirmation code and enter it below to sign in!
                </Text>
              </Box>

              <Box>
                <TextInput
                  style={{ width: '100%', fontSize: 24 }}
                  ref={ref => this.props.isFocused && ref && ref.focus()}
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={confirmationCode => this.setState({ confirmationCode })}
                />
                <Button
                  style={{ marginTop: 6 }}
                  onPress={this._onSubmitConfirmationCode.bind(this)}>
                  <Text>submit</Text>
                </Button>
              </Box>
            </View>
          ) : null}

          {this.state.confirmationCodeSubmitted ? (
            <Box>
              <Text>Verifying confirmation code and signing in...</Text>
            </Box>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    );
  }

  async _onSubmitPhoneNumber() {
    try {
      this.setState({ phoneNumberSubmitted: true });
      const confirmationResult = await firebase
        .auth()
        .signInWithPhoneNumber(this.state.phoneNumber);
      this.setState({ confirmationResult });
    } catch (e) {
      Alert.alert(`Error verifying phone number: ${e.message}`);
      this.setState(AuthScreen.initialState);
    }
  }

  async _onSubmitConfirmationCode() {
    try {
      this.setState({ confirmationCodeSubmitted: true });
      await this.state.confirmationResult.confirm(this.state.confirmationCode);
    } catch (e) {
      Alert.alert(`Error verifying code: ${e.message}`);
      this.setState(AuthScreen.initialState);
    }
  }
}

// Present a 'new profile' creation flow
@withNavigationFocus
export class NewProfileScreen extends React.Component {
  state = {
    tentativeUsername: null,
    invalidUsernameReason: null,

    saving: false,
  };

  componentDidMount() {
    this._onChangeTentativeUsername('');

    this._numEdits = 0;
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', padding: 10 }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {!this.state.saving ? (
            <View>
              <Box>
                <Text>
                  Pick your brushy username! This is how everyone else will identify you. You can
                  change it later too.
                </Text>
              </Box>

              <Box>
                <TextInput
                  style={{ width: '100%', fontSize: 24 }}
                  ref={ref => this.props.isFocused && ref && ref.focus()}
                  maxLength={30}
                  onChangeText={this._onChangeTentativeUsername.bind(this)}
                />
                {this.state.invalidUsernameReason ? (
                  <Text style={{ marginTop: 6 }}>{this.state.invalidUsernameReason}</Text>
                ) : (
                  <Button style={{ marginTop: 6 }} onPress={this._onSaveUsername.bind(this)}>
                    <Text>save</Text>
                  </Button>
                )}
              </Box>
            </View>
          ) : null}

          {this.state.saving ? (
            <Box>
              <Text>Saving your username...</Text>
            </Box>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    );
  }

  _onChangeTentativeUsername(text) {
    const editNum = ++this._numEdits;

    let invalidUsernameReason;
    if (!text.match(/^[A-Za-z0-9._]*$/)) {
      invalidUsernameReason =
        'Your username should only contain letters, numbers, periods and underscores.';
    } else if (text.length < 3) {
      invalidUsernameReason = 'Your username should be at least 3 characters long.';
    } else if (text.length > 30) {
      invalidUsernameReason = 'Your username should be at most 30 characters long.';
    } else if (text.match(/^brushy/)) {
      invalidUsernameReason = "Your username shouldn't start with 'brushy'.";
    }

    if (invalidUsernameReason) {
      this.setState({
        tentativeUsername: null,
        invalidUsernameReason,
      });
    } else {
      this.setState(
        {
          tentativeUsername: null,
          invalidUsernameReason: 'Checking if this username is taken...',
        },
        () => this._checkTaken(text, editNum)
      );
    }
  }

  _checkTaken = debounce(async (text, editNum) => {
    const taken = !(await Db.profiles.where('username', '==', text).get()).empty;

    // Is this a stale edit?
    if (editNum !== this._numEdits) {
      return;
    }

    if (taken) {
      this.setState({
        tentativeUsername: null,
        invalidUsernameReason: 'This username is taken, try a different one.',
      });
    } else {
      this.setState({
        tentativeUsername: text,
        invalidUsernameReason: null,
      });
    }
  }, 200);

  async _onSaveUsername() {
    if (this.state.tentativeUsername && !this.state.invalidUsernameReason) {
      this.setState({ saving: true });
      try {
        await Db.currentProfile().set({
          username: this.state.tentativeUsername,
        });
      } catch (e) {
        Alert.alert(`Error saving username: ${e.message}`);
        this.setState({ saving: false });
      }
    }
  }
}
