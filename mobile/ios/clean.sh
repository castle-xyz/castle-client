#!/bin/bash

# build
xcodebuild \
	-workspace brushy.xcworkspace \
	-scheme brushy \
	-sdk iphoneos11.4 \
  -jobs 6 \
	CONFIGURATION_BUILD_DIR=/tmp/brushy-build \
	clean \
	| xcpretty -r json-compilation-database --output compile_commands.json
