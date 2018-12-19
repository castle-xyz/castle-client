#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n io.expo.brushy/host.exp.exponent.MainActivity
