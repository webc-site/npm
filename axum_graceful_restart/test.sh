#!/usr/bin/env bash

DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -ex

cd ./tests

TARGET_DIR=$(cargo metadata --no-deps --format-version=1 | jq -r '.target_directory')

# 禁用增量编译防止指纹冲突
export CARGO_INCREMENTAL=0

cargo build

cd ..

exec $TARGET_DIR/debug/axum_graceful_restart_tests
