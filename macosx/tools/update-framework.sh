#!/bin/sh
# usage: update-framework [path]
#
# e.g. update-framework ./path/to/FreeType.framework
#
# WARNING: recommend doing this from someplace version controlled, because it deletes files.
# 
# fixes a pre-mavericks macOS framework to follow the convention specified here:
# https://developer.apple.com/library/archive/technotes/tn2206/_index.html#//apple_ref/doc/uid/DTS40007919-CH1-TNTAG201
#

set -e

if [ -z "$1" ]
then
    echo "#usage: update-framework [path]"
    exit 1
fi

if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "inside a git repo, continuing"
else
    echo "not inside a git repo, exiting"
    exit 1
fi

pushd $1

echo "ln -s Versions/A Versions/Current"
pushd Versions
rm -rf Current
ln -s A Current
popd

echo "Removing invalid root level stuff"
find . ! -path "./Versions" ! -path . -maxdepth 1 -exec rm -r {} \;

echo "ln -s Versions/Current/* ."
ln -s Versions/Current/* .

popd
