#!/bin/bash

# build
xcodebuild \
	-workspace castle.xcworkspace \
	-scheme castle \
	-sdk iphoneos11.4 \
  -jobs 6 \
	CONFIGURATION_BUILD_DIR=/tmp/castle-build \
	clean \
	| xcpretty -r json-compilation-database --output compile_commands.json
