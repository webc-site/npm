#!/usr/bin/env bash

cd ../../conf/prod/smtp
set -a
. smtp.env
. smtp.test.env
R_USER=
R_RESP=3
R_NODE=100.65.0.2
set +a
