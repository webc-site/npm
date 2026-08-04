#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

TARGET="x86_64-unknown-linux-musl"
OUT_DIR="bin/$TARGET"
mkdir -p "$OUT_DIR"

IMAGE="captcha_srv_builder:latest"
docker build -t "$IMAGE" -f build.dockerfile .

ROOT_DIR=$(realpath $DIR/../../..)
CACHE_DIR="/tmp/captcha_srv_build"
mkdir -p "$CACHE_DIR/cargo" "$CACHE_DIR/target"

docker run --rm \
  -v "$ROOT_DIR:/workspace" \
  -v "$CACHE_DIR/cargo:/usr/local/cargo/registry" \
  -v "$CACHE_DIR/target:/tmp/target" \
  -e CARGO_TARGET_DIR=/tmp/target \
  -w /workspace/git/npm/captcha_srv \
  "$IMAGE" \
  cargo build --release --target "$TARGET"

cp "$CACHE_DIR/target/$TARGET/release/captcha_srv" "$OUT_DIR/"
