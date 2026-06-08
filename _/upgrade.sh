#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR/..
set -x

ncu -u && bun i --no-cache

set +x
CHANGES=$(git status --porcelain | grep -E 'package\.json|bun\.lock' | cut -c 4- || true)
if [ -n "$CHANGES" ]; then
  set -x
  echo "$CHANGES" | xargs git add
  git commit -m "chore: upgrade dependencies"
  git push
fi

