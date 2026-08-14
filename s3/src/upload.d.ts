/// <reference types="node" />

declare const _default: (
  s3_id: string,
  s3_sk: string,
  s3_host: string,
  s3_bucket: string,
  s3_region?: string
) => (buf: Buffer, file_name: string) => Promise<string>;
export default _default;
