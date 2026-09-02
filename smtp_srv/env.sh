#!/usr/bin/env bash

cd ../../conf/prod/smtp
set -a
. conf.env
. default.env
. api.env
set +a
