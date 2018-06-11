#!/bin/bash
echo "Starting deployment."
echo "Target: gh-pages branch"

TARGET_BRANCH="master:gh-pages"

TEMP_DIRECTORY="tmp"
CURRENT_COMMIT=`git rev-parse HEAD`
ORIGIN_URL=`git config --get remote.origin.url`
ORIGIN_URL_WITH_CREDENTIALS=${ORIGIN_URL/\/\/github.com/\/\/$GITHUB_TOKEN@github.com}

echo "Compiling content."
mkdir $TEMP_DIRECTORY || exit 1
mkdir $TEMP_DIRECTORY/arjs || exit 1
mkdir $TEMP_DIRECTORY/aframe-ar || exit 1
mkdir $TEMP_DIRECTORY/3d-models || exit 1
mkdir $TEMP_DIRECTORY/common || exit 1

cp index.html $TEMP_DIRECTORY || exit 1

cp -r common/* $TEMP_DIRECTORY/common || exit 1
cp -r arjs/* $TEMP_DIRECTORY/arjs || exit 1
cp -r 3d-models/* $TEMP_DIRECTORY/3d-models || exit 1
cp -r aframe-ar/* $TEMP_DIRECTORY/aframe-ar || exit 1

cp .gitignore $TEMP_DIRECTORY || exit 1

cd $TEMP_DIRECTORY

git init && \

echo "Pushing new content to $ORIGIN_URL"
git config user.name "Travis-CI" || exit 1
git config user.email "vincent.ogloblinsky@gmail.com" || exit 1

git add -A . || exit 1
git commit --allow-empty -m "Regenerated static content for $CURRENT_COMMIT" || exit 1
git push --force "$ORIGIN_URL_WITH_CREDENTIALS" $TARGET_BRANCH > /dev/null 2>&1

echo "Deployed successfully."
exit 0