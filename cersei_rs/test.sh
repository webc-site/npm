#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

../sh/clippy.sh
./build.js

../_/hook/fmt.js

bun test
# cargo nextest run --all-features --no-capture
