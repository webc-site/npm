#!/usr/bin/env bash

set -ex

NEW_VER=$(./js/versionBump.js)

cargo test --all-features -p ext_mime

git add .
git commit -m "chore: auto update ext_mime to v${NEW_VER}"

if [ -n "$GITHUB_ENV" ]; then
  echo "NEED_PUSH=true" >>"$GITHUB_ENV"
fi

cargo publish --registry crates-io --allow-dirty
