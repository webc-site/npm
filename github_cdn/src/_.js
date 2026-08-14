import md5B64 from "@3-/base64url/md5B64.js";
import urlExist from "@1-/url_exist";
import cdn from "./cdn.js";
import reqInit from "./req.js";
import putContent from "./putContent.js";
import ensureMain from "./ensureMain.js";
import createBranch from "./createBranch.js";
import ifElse from "./ifElse.js";

const exist = (status) => status === 409 || status === 422;

export default (token, org_repo) => {
  const req = reqInit(token, org_repo),
    put = putContent(req),
    main = ensureMain(req),
    branch = createBranch(req);

  return async (buf, ext) => {
    // ext 格式为不带点后缀，如 "svg"
    const hash = md5B64(buf),
      name = hash.slice(0, 2),
      path = hash.slice(2) + "." + ext,
      url = cdn(org_repo, name, path);

    if (await urlExist("https:" + url)) {
      return url;
    }

    const content = Buffer.from(buf).toString("base64"),
      upload = () => put(path, name, content);

    await ifElse(upload, async (err) => {
      const { status } = err;
      if (status === 404) {
        const sha = await main();
        await branch(name, sha);
        await ifElse(upload, (retry_err) => {
          const { status } = retry_err;
          if (!exist(status)) {
            throw retry_err;
          }
        })();
      } else if (!exist(status)) {
        throw err;
      }
    })();

    return url;
  };
};
