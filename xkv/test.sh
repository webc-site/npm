#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -a
. ../../conf/kvrocks/conf.env
set +a
set -x

cd tests
cargo run
