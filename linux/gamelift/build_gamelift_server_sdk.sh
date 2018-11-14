#!/usr/bin/env bash

cd GameLift-Cpp-ServerSDK
rm -rf out
mkdir -p out/Downloads
cp ../gamelift-download-cache/* out/Downloads
cd out
cmake ..
make
cp -r out/prefix/* ../gamelift-build