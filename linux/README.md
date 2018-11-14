From this directory:

`./build_docker_image.sh` - Only need to run once

`./docker.sh` - Creates a new container and start a bash session.

Once you're in the container, cd into `linux` and run `./run_cmake.sh`.
Then try running `LD_LIBRARY_PATH=lib ./build/castle-server file:///app/linux/sync.lua/example_basic.lua` to start the server.

OpenSSL from
http://www.openssl.org/source/openssl-1.0.2l.tar.gz
