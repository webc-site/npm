#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

if [ ! -d "node_modules" ]; then
  bun i
fi

bun x @1-/fix
oxfmt
oxlint --fix
bun x knip
