#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
export SDB='{"uri":"http://127.0.0.1:9050","username":"i","password":"TzJGXFIMQlUj4eBX","namespace":"dev","database":"i"}'
set -x

cargo nextest run --all-features --no-capture
