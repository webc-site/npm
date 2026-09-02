import md5B64 from "@3-/base64url/md5B64.js";
import urlExist from "@1-/url_exist";
import cdnGen from "./CDN.js";
import reqInit from "./req.js";
import putContent from "./putContent.js";
import ensureMain from "./ensureMain.js";
import createBranch from "./createBranch.js";
import ifElse from "./ifElse.js";

const exist = (status) => status === 409 || status === 422,
  check = async (gen) => {
    for (const url of gen()) {
      if (await urlExist("https:" + url)) {
        return url;
      }
    }
  };

/*
上传文件至 GitHub 并返回 CDN URL
buf: 文件内容 (Uint8Array / Buffer)
ext: 文件后缀 (如 "svg")
*/
export default (token, org_repo) => {
  const req = reqInit(token, org_repo),
    put = putContent(req),
    main = ensureMain(req),
    branch = createBranch(req);

  return async (buf, ext) => {
    const hash = md5B64(buf),
      name = hash.slice(0, 2),
      path = hash.slice(2) + "." + ext,
      gen = () => cdnGen(org_repo, name, path),
      exist_url = await check(gen);

    if (exist_url) {
      return exist_url;
    }

    const content = Buffer.from(buf).toString("base64"),
      upload = () => put(path, name, content),
      upload_wrap = ifElse(upload, (err) => {
        if (!exist(err.status)) {
          throw err;
        }
      });

    await ifElse(upload, async (err) => {
      const { status } = err;
      if (status === 404) {
        const sha = await main();
        await branch(name, sha);
        await upload_wrap();
      } else if (!exist(status)) {
        throw err;
      }
    })();

    for (let i = 0; i < 3; ++i) {
      const cdn_url = await check(gen);
      if (cdn_url) {
        return cdn_url;
      }
    }

    return gen().next().value;
  };
};
