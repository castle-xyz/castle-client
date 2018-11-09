cmake -DMEGA_LOVE=../love \
	-DOPENSSL_ROOT_DIR=/usr/local/ssl -DOPENSSL_USE_STATIC_LIBS=TRUE \
	-H. -Bbuild

cmake --build build --config Release