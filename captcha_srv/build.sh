#!/usr/bin/env bash

set -e
DIR=$(realpath $0) && DIR=${DIR%/*}
cd $DIR
set -x

ROOT_DIR=$(realpath $DIR/../../..)
CACHE_DIR="/tmp/captcha_srv_build"
mkdir -p "$CACHE_DIR/cargo" "$CACHE_DIR/target"

run() {
  local CPU=$1
  case "$CPU" in
    amd64|x86_64)
      CPU="amd64"
      ARCH="x86_64"
      ;;
    arm64|aarch64)
      CPU="arm64"
      ARCH="aarch64"
      ;;
    *)
      echo "Unsupported CPU: $CPU"
      exit 1
      ;;
  esac

  local TARGET="${ARCH}-unknown-linux-musl"
  local PLATFORM="linux/$CPU"
  local OUT_DIR="bin/$TARGET"
  mkdir -p "$OUT_DIR"

  local IMAGE="captcha_srv_builder:$CPU"
  docker build \
    --platform "$PLATFORM" \
    --build-arg PLATFORM="$PLATFORM" \
    --build-arg TARGET="$TARGET" \
    -t "$IMAGE" \
    -f build.dockerfile .

  docker run --platform "$PLATFORM" --rm \
    -v "$ROOT_DIR:/workspace" \
    -v "$CACHE_DIR/cargo:/usr/local/cargo/registry" \
    -v "$CACHE_DIR/target:/tmp/target" \
    -e CARGO_TARGET_DIR=/tmp/target \
    -w /workspace/git/npm/captcha_srv \
    "$IMAGE" \
    cargo build --release --target "$TARGET"

  cp "$CACHE_DIR/target/$TARGET/release/captcha_srv" "$OUT_DIR/"
}

run amd64
run arm64

