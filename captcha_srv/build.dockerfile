FROM rust:latest

RUN rustup target add x86_64-unknown-linux-musl \
 && apt-get update \
 && apt-get install -y musl-tools musl-dev \
 && rm -rf /var/lib/apt/lists/*
