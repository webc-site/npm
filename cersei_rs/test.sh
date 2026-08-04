#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

../sh/clippy.sh
./build.js

bun test
../_/hook/fmt.js
