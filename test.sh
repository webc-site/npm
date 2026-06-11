#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
./_/hook/fmt.js

CORES=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 2)

set -x
bun test \
  --only-failures \
  --parallel=$CORES \
  --path-ignore-patterns "{github_cdn,s3,cersei_rs}/**"
