docker rm castle-dev > /dev/null
docker run -it --name castle-dev --mount type=bind,source="$(pwd)"/..,target=/app castle-dev bash
