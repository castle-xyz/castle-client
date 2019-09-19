#!/bin/bash

GRADLE_COMMAND="./gradlew"
if grep -q Microsoft /proc/version; then
    GRADLE_COMMAND="cmd.exe /c gradlew.bat"
fi

$GRADLE_COMMAND --no-daemon ${1:-installDevMinSdkDevKernelDebug} --stacktrace
