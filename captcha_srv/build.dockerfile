ARG PLATFORM=linux/amd64
FROM --platform=${PLATFORM} rust:latest

ARG TARGET=x86_64-unknown-linux-musl

RUN rustup target add ${TARGET} \
 && apt-get update \
 && apt-get install -y musl-tools musl-dev \
 && rm -rf /var/lib/apt/lists/*
