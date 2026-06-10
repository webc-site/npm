#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
./_/hook/fmt.js

set -x
bun test --only-failures
