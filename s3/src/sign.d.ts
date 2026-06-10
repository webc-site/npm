/// <reference types="node" />

declare const sign: (
  s3_id: string,
  s3_sk: string,
  s3_host: string,
  s3_bucket: string,
  s3_region?: string,
) => (
  buf: Buffer,
  path: string,
  mime: string,
  cache_control: string,
) => Promise<Record<string, string>>;

export default sign;
