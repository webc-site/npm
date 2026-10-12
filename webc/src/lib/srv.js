import { createServer } from "node:http";
import { join } from "node:path";
import { existsSync, statSync } from "node:fs";
import read from "@3-/read";
import serveHandler from "serve-handler";
import redirectRewrite from "../site/redirectRewrite.js";
import open from "./open.js";

const ROOT_PREFIX = "/$/",
  LOCAL = "http://127.0.0.1";

export default async (root, dir, port) => {
  const rewrites = await redirectRewrite(dir),
    { GIT_CDN } = await import(join(root, "src/conf/GIT_CDN.js")),
    rootSrv = (req, res) => {
      req.url = req.url.slice(2);
      return serveHandler(req, res, { public: root });
    },
    server = createServer(async (req, res) => {
      if (req.url.startsWith(ROOT_PREFIX)) {
        return rootSrv(req, res);
      }

      const { pathname } = new URL(req.url, LOCAL);

      if (req.method === "GET" && pathname.endsWith(".js")) {
        const file_path = join(dir, pathname);
        if (existsSync(file_path) && statSync(file_path).isFile()) {
          const txt = read(file_path),
            content = txt.replaceAll(GIT_CDN, ROOT_PREFIX);
          res.setHeader("Content-Type", "text/javascript; charset=utf-8");
          return res.end(content);
        }
      }

      return serveHandler(req, res, {
        public: dir,
        rewrites
      });
    });

  server.listen(port, () => {
    const url = LOCAL + ":" + port;
    console.log(url);
    open(url);
  });
};
