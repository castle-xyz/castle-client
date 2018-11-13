docker rm castle-holy-build-box > /dev/null
docker run -it --name castle-holy-build-box --mount type=bind,source="$(pwd)"/../..,target=/app castle-holy-build-box:latest bash
