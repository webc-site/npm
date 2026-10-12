#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR/..
set -x

fd -g bun.lock -x rm
ncu --deep -u --dep prod,dev,peer
bun i
git add .
