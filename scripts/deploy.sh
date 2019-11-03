#!/bin/bash
echo "Prepare deployment."
echo "Target: gh-pages branch"

TEMP_DIRECTORY="tmp"

echo "Prepare content."
mkdir $TEMP_DIRECTORY || exit 1
mkdir $TEMP_DIRECTORY/arjs || exit 1
mkdir $TEMP_DIRECTORY/aframe-ar || exit 1
mkdir $TEMP_DIRECTORY/3d-models || exit 1
mkdir $TEMP_DIRECTORY/common || exit 1
mkdir $TEMP_DIRECTORY/webxr || exit 1

cp index.html $TEMP_DIRECTORY || exit 1

cp -r common/* $TEMP_DIRECTORY/common || exit 1
cp -r arjs/* $TEMP_DIRECTORY/arjs || exit 1
cp -r 3d-models/* $TEMP_DIRECTORY/3d-models || exit 1
cp -r aframe-ar/* $TEMP_DIRECTORY/aframe-ar || exit 1
cp -r webxr/* $TEMP_DIRECTORY/webxr || exit 1

cp .gitignore $TEMP_DIRECTORY || exit 1