import req from "@3-/req/req.js";
import s3Sign from "./sign.js";
import sha3b64 from "./sha3b64.js";
import has from "@1-/url_exist";
import extMime from "./extMime.js";
import { CACHE_CONTROL } from "./const.js";

export default (s3_id, s3_sk, s3_host, s3_bucket, s3_region) => {
  const sign = s3Sign(s3_id, s3_sk, s3_host, s3_bucket, s3_region);

  // buf 必须是 Buffer 实例 (以避免被请求库错误序列化)
  return async (buf, file_name) => {
    const sha3_b64 = sha3b64(buf),
      url = "https://" + s3_host + "/" + s3_bucket + "/" + sha3_b64;

    if (await has(url)) {
      return sha3_b64;
    }

    const content_type = extMime(file_name),
      headers = await sign(buf, sha3_b64, content_type, CACHE_CONTROL);

    await req(url, {
      method: "PUT",
      headers,
      body: buf,
    });

    return sha3_b64;
  };
};
