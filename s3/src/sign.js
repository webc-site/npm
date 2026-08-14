import utf8e from "@3-/utf8/utf8e.js";
import amzDate from "./amzDate.js";

// sha256 的入参 data 必须是 Buffer 或 Uint8Array 实例，不得为 string
// hmac 的入参 key 必须是 Buffer 或 Uint8Array，data 必须是 string
const sha256 = async (data) => Buffer.from(await crypto.subtle.digest("SHA-256", data)),
  hmac = async (key, data) =>
    Buffer.from(
      await crypto.subtle.sign(
        "HMAC",
        await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, [
          "sign"
        ]),
        utf8e(data)
      )
    ),
  hex = (buf) => buf.toString("hex");

export default (s3_id, s3_sk, s3_host, s3_bucket, s3_region) => {
  return async (buf, path, mime, cache_control) => {
    const payload_hash = hex(await sha256(buf)),
      [date_only, amz_date] = amzDate(),
      canonical_request = [
        "PUT",
        "/" + s3_bucket + "/" + path,
        "",
        "cache-control:" + cache_control,
        "content-type:" + mime,
        "host:" + s3_host,
        "x-amz-content-sha256:" + payload_hash,
        "x-amz-date:" + amz_date,
        "",
        "cache-control;content-type;host;x-amz-content-sha256;x-amz-date",
        payload_hash
      ].join("\n"),
      credential_scope = [date_only, s3_region, "s3", "aws4_request"].join("/"),
      string_to_sign = [
        "AWS4-HMAC-SHA256",
        amz_date,
        credential_scope,
        hex(await sha256(utf8e(canonical_request)))
      ].join("\n"),
      key = await [s3_region, "s3", "aws4_request", string_to_sign].reduce(
        async (k, step) => hmac(await k, step),
        hmac(utf8e("AWS4" + s3_sk), date_only)
      ),
      headers = {
        "Cache-Control": cache_control,
        "content-type": mime,
        "Content-Length": String(buf.length),
        Authorization:
          "AWS4-HMAC-SHA256 Credential=" +
          s3_id +
          "/" +
          credential_scope +
          ",SignedHeaders=cache-control;content-type;host;x-amz-content-sha256;x-amz-date, Signature=" +
          hex(key),
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date
      };

    return headers;
  };
};
