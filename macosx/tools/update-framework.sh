#!/bin/sh
# usage: update-framework [path] [lib name]
#
# e.g. update-framework ./path/to/FreeType.framework FreeType
#
# WARNING: recommend doing this from someplace version controlled, because it deletes files.
# 
# fixes a pre-mavericks macOS framework to follow the convention specified here:
# https://developer.apple.com/library/archive/technotes/tn2206/_index.html#//apple_ref/doc/uid/DTS40007919-CH1-TNTAG201
#
# assumes you have castle's cert in your keychain.
# Upon success you should see something like:
# > signed bundle with Mach-O thin (x86_64)

set -e

if [ -z "$1" ]
then
    echo "#usage: update-framework [path] [lib name]"
    exit 1
fi

if [ ! git rev-parse --git-dir > /dev/null 2>&1; ]
then
   echo "not inside a git repo, exiting"
   exit 1
fi

echo "Removing invalid root level stuff"
find $1 ! -path "./Versions" ! -path . -maxdepth 1 -exec rm -r {} \;

echo "ln -s Versions/Current/* ."
ln -s Versions/Current/* .

echo "Codesigning new contents"
DEVELOPER_IDENTITY=$(security find-identity -v -p codesigning | grep -o "Developer ID Application: Castle Games, Inc\. (.*)")
codesign --verbose --deep -s "${DEVELOPER_IDENTITY}" Versions/Current/$2
