#!/bin/bash

GRADLE_COMMAND="./gradlew"
if grep -q Microsoft /proc/version; then
    GRADLE_COMMAND="cmd.exe /c gradlew.bat"
fi

$GRADLE_COMMAND ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n io.expo.castle/host.exp.exponent.MainActivity
