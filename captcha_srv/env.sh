#!/usr/bin/env bash
if [ -z "${R_PORT}" ]; then
  set -a
  . ../../worker/docker/.env
  R_NODE=127.0.0.1:$R_PORT
  set +a
fi
