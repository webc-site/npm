#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

bun x oxfmt >/dev/null
bun x oxlint --fix >/dev/null
bun test --only-failures
