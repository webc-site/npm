#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -a
eval "$(sed 's/ *= */=/g' ../../conf/kvrocks/conf.env)"
set +a
set -x

cargo test --all-features -- --nocapture
