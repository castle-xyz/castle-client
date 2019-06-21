#!/bin/sh
#
# verify-gatekeeper <app>
#
# verifies whether the given app conforms to gatekeeper according to this apple doc:
# https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Procedures/Procedures.html#//apple_ref/doc/uid/TP40005929-CH4-TNTAG211

set -e

if [ -z "$1" ]
then
    echo "usage: verify-gatekeeper.sh /path/to/Some.app"
    exit 1
fi

echo "Verifying gatekeeper conformance..."

# Info.plist is required to contain CFBundlePackageType: APPL
echo "check CFBundlePackageType == APPL"
if /usr/libexec/PlistBuddy -c "Print :CFBundlePackageType" "${1}/Contents/Info.plist" | grep -qF "APPL"
then
    echo "  pass"
else
    echo "  failed"
    exit 1
fi

# Expect output to look like:
# /Applications/Castle.app: valid on disk
# /Applications/Castle.app: satisfies its Designated Requirement
echo "codesign --verify"
if codesign --verify --deep --strict --verbose=1 $1 2>&1 | grep -qF "satisfies its Designated Requirement"
then
    echo "  pass"
else
    echo "  failed"
    exit 1
fi

# Expect output to look like:
# /Applications/Castle.app: accepted
# source=Developer ID
# origin=Developer ID Application: Castle Games, Inc. (48GFST92BB)
echo "spctl --assess"
if spctl -a -t exec -vv $1 2>&1 | grep -qF "accepted"
then
    echo "  pass"
else
    echo "  failed"
    exit 1
fi
