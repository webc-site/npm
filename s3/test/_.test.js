#!/usr/bin/env -S bun test

import { test, expect } from "bun:test";
import { S3_HOST, S3_BUCKET, S3_ID, S3_SK, S3_REGION, S3_CDN } from "../../conf/s3/IMG.js";
import uploadInit from "../src/upload.js";

test("上传 s3", async () => {
  const upload = uploadInit(S3_ID, S3_SK, S3_HOST, S3_BUCKET, S3_REGION),
    data = "test-s3-" + Date.now(),
    buf = Buffer.from(data),
    sha3_b64 = await upload(buf, "test.txt"),
    url = S3_CDN + sha3_b64,
    res = await fetch(url),
    text = await res.text();

  expect(sha3_b64).toBeString();
  expect(res.status).toBe(200);
  expect(text).toBe(data);
}, 15000);
