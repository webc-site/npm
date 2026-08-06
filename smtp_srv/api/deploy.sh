#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

ENV=../../../conf/prod/smtp/api.env
[ -f "$ENV" ] && bunx wrangler secret bulk "$ENV"

bun run deploy

