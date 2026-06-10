#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

if [ -z "$1" ]; then
  echo "$0 <PROJECT>"
  exit 1
fi

PROJECT=$1

if [ -f "$PROJECT/Cargo.toml" ]; then
  ./_/rs/dist.js $PROJECT
else
  ./dist/src/dist.js $PROJECT
  ./_/upgrade.sh
fi
