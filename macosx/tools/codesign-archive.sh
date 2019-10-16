#!/bin/sh
# 
# Codesign an existing Castle archive

set -e

if [ -z "$1" ]
then
    echo "usage: codesign-archive.sh castle-archive-path certificate-path"
    exit 1
fi

ARCHIVE_PATH=$1
CERT_PATH=$2

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
CERT_PASSWORD=$APPLE_DEVELOPER_ID_CERT_PASSWORD
security import $CERT_PATH -A -k $TEMP_KEYCHAIN_PATH -f pkcs12 -P $CERT_PASSWORD

echo "Finding codesigning identity in keychain..."

APPS_PATH=$ARCHIVE_PATH/Products/Applications
APP_PATH=$APPS_PATH/Castle.app
CODESIGN_IDENTITY=$(security find-identity -v -p codesigning $TEMP_KEYCHAIN_PATH | grep -o "Developer ID Application: Castle Games, Inc\. (.*)")

echo "Adding keychain to user keychain search list..."
security list-keychains -s $TEMP_KEYCHAIN_PATH

echo "User keychains list:"
security list-keychains -d user

echo "Codesigning all frameworks..."
find $APP_PATH/Contents/Frameworks -maxdepth 1 -name "*.framework" -exec codesign --verbose --deep --force --keychain $TEMP_KEYCHAIN_PATH -s "${CODESIGN_IDENTITY}" {} \;

echo "Try codesigning Resource binaries..."
find $APP_PATH/Contents/Resources -perm +111 -type f -exec codesign --verbose --deep --force --keychain $TEMP_KEYCHAIN_PATH -s "${CODESIGN_IDENTITY}" {} \;
find $APP_PATH/Contents/Resources/obs/bin -name "*.dylib" -exec codesign --verbose --deep --force --keychain $TEMP_KEYCHAIN_PATH -s "${CODESIGN_IDENTITY}" {} \;

echo "Codesigning Castle.app..."
codesign --verbose --deep --keychain $TEMP_KEYCHAIN_PATH -s "${CODESIGN_IDENTITY}" $APP_PATH

echo "Cleaning up keychain..."
security delete-keychain $TEMP_KEYCHAIN_PATH

echo "Verifying codesigning identity..."
if codesign -dvv --deep $APP_PATH 2>&1 | grep -qF "Authority=${CODESIGN_IDENTITY}"
then
    echo "App is signed with identity: ${CODESIGN_IDENTITY}"
else
    echo "Codesigning failed:"
    codesign -dvv --deep $APP_PATH
    exit 1
fi
