#!/bin/sh

rm -rf archive.xcarchive
rm -rf pkg-root

VERSION=$(/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' Supporting/ghost-macosx.plist)

xcodebuild -project ghost.xcodeproj -config Release -scheme ghost-macosx -archivePath ./archive archive
mkdir -p pkg-root/Applications
mv archive.xcarchive/Products/Applications/Castle.app pkg-root/Applications/
pkgbuild --root pkg-root --component-plist Supporting/ghost-pkg.plist --identifier io.playcastle.castle --version $VERSION Castle-$VERSION.pkg
cp Castle-$VERSION.pkg Castle.pkg

rm -rf archive.xcarchive
rm -rf pkg-root

