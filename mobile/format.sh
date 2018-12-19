#!/bin/sh
prettier --write js/*.js *.js
clang-format -i -style=file ios/brushy/*.{h,m*}
