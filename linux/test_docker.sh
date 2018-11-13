docker rm castle-test > /dev/null
docker run -it --name castle-test --mount type=bind,source="$(pwd)"/..,target=/app amazonlinux:latest bash
