import ERR from "@3-/log/ERR.js";
import { ghPath } from "./cdn.js";

const CDN_HOSTS = ["cdn.jsdmirror.com", "fastly.jsdelivr.net", "cdn.jsdelivr.net"],
  fetchCdn = async (path, parse) => {
    for (const host of CDN_HOSTS) {
      const url = "https://" + host + path;
      try {
        const res = await fetch(url);
        if (res.ok) return await parse(res);
      } catch (err) {
        ERR(url, err);
      }
    }
    return null;
  };

export const pkgJson = (pkg) => fetchCdn("/npm/" + pkg + "/package.json", (r) => r.json()),
  pkgVer = async (pkg) => (await pkgJson(pkg))?.version,
  ghFetch = (repo, tag, path) => fetchCdn(ghPath(repo, tag, path), (r) => r.text());
