#!/usr/bin/env bash

cmake -DMEGA_LOVE=../love \
	-DOPENSSL_ROOT_DIR=/usr/local/ssl -DOPENSSL_USE_STATIC_LIBS=TRUE \
	-D CMAKE_PREFIX_PATH=gamelift/gamelift-build \
	-H. -Bbuild

cmake --build build --config Release