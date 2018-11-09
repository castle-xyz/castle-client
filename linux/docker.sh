docker rm castle-dev > /dev/null
docker run -it --name castle-dev -p 22122:22122 --mount type=bind,source="$(pwd)"/..,target=/app castle-dev bash
