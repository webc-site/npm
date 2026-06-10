/// <reference types="node" />

declare const _default: (
  token: string,
  org_repo: string,
) => (buf: Uint8Array | Buffer, ext: string) => Promise<string>;

export default _default;
