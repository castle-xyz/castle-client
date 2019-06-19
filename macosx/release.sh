#!/bin/sh

set -e

if [[ -n $(git status --porcelain) ]]; then
  echo "Tree is dirty, aborting"
  exit 1
fi

echo "Testing cloning new private repo..."

if [ ! -d castle-codesigning-certs ]; then
    echo "Cloning 'castle-codesigning-certs'..."
  git clone https://$CASTLE_GITHUB_TOKEN@github.com/castle-games/castle-codesigning-certs.git
fi
cd castle-codesigning-certs
echo "Pulling 'castle-codesigning-certs'..."
git pull origin master
echo "Running ls"
ls -l
