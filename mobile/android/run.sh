#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n io.expo.castle/host.exp.exponent.MainActivity
