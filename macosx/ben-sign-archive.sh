#!/bin/sh

# Sign an existing test archive

set -e

GIT_HASH=$(git rev-parse HEAD)
MACOS_BASE_VERSION=1
MACOS_VERSION=$MACOS_BASE_VERSION.$(git rev-list release-root..HEAD --count)

TEMP_KEYCHAIN_PATH=/private/tmp/castle/castle-$MACOS_VERSION.keychain
TEMP_KEYCHAIN_PASSWORD="Castle"

echo "Creating temp keychain at path..."
echo $TEMP_KEYCHAIN_PATH
if [ -f $TEMP_KEYCHAIN_PATH ]
then
    echo "Deleting existing temp keychain first..."
    security delete-keychain $TEMP_KEYCHAIN_PATH
fi
mkdir -p TEMP_KEYCHAIN_PATH
security create-keychain -p $TEMP_KEYCHAIN_PASSWORD $TEMP_KEYCHAIN_PATH

echo "Unlocking keychain..."
security unlock-keychain -p $TEMP_KEYCHAIN_PASSWORD $TEMP_KEYCHAIN_PATH

# echo "Showing keychain info..."
# security show-keychain-info $TEMP_KEYCHAIN_PATH

echo "Importing cert to keychain..."
CERT_PATH=../../castle-codesigning-certs/macos/CastleDeveloperID.p12
CERT_PASSWORD="CastleDeveloperID"
security import $CERT_PATH -A -k $TEMP_KEYCHAIN_PATH -f pkcs12 -P $CERT_PASSWORD

APPS_PATH=./archive.xcarchive/Products/Applications
APP_PATH=$APPS_PATH/Castle.app
CODESIGN_IDENTITY=$(security find-identity -v -p codesigning | grep -o "Developer ID Application: Castle Games, Inc\. (.*)")

echo "Codesigning all frameworks..."
find $APP_PATH/Contents/Frameworks -maxdepth 1 -name "*.framework" -exec codesign --verbose -s "${CODESIGN_IDENTITY}" {} \;

echo "Codesigning app..."
codesign --verbose --deep -s "${CODESIGN_IDENTITY}" $APP_PATH

echo "Codesigning helper app..."
HELPER_PATH="${APPS_PATH}/Castle Helper.app"
codesign --verbose --deep -s "${CODESIGN_IDENTITY}" "${HELPER_PATH}"

echo "Cleaning up keychain..."
security delete-keychain $TEMP_KEYCHAIN_PATH
