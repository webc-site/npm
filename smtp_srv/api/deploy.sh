#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

CONF_DIR=../../../conf/prod/smtp
cat "$CONF_DIR/conf.env" "$CONF_DIR/default.env" "$CONF_DIR/api.env" 2>/dev/null | bunx wrangler secret bulk

bun run deploy


