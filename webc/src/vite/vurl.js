import read from "@3-/read";

export default (matched_name, component_li, renderComponentHtml) => ({
  name: "vite-plugin-virtual-pug-routes",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, "http://127.0.0.1"),
        pathname = url.pathname;

      if (pathname === "/") {
        res.writeHead(302, { Location: "/WebC.ls" });
        res.end();
        return;
      }

      const tryReply = async (type, getBody) => {
        try {
          const body = await getBody();
          if (body) {
            res.setHeader("Content-Type", type);
            res.end(body);
            return true;
          }
        } catch (e) {
          console.error(e);
          next(e);
          return true;
        }
      };

      if (pathname.startsWith("/src/js/") && pathname.endsWith(".js")) {
        if (
          await tryReply("application/javascript; charset=utf-8", async () => {
            const result = await server.transformRequest(req.url);
            return result?.code;
          })
        )
          return;
      }

      const send = (html) =>
          tryReply("text/html", async () => server.transformIndexHtml(req.url, await html)),
        part_li = pathname.split("/").filter(Boolean);

      if (part_li.length === 1) {
        const name = part_li[0],
          name_lower = name.toLowerCase(),
          matched = component_li.find((c) => c.toLowerCase() === name_lower);
        if (matched) {
          await send(renderComponentHtml(matched)(read));
          return;
        }
      } else if (part_li[0] === "js" && part_li.length >= 2) {
        await send(
          renderComponentHtml("WebC.js")(
            () => 'c-webc-js(rel="' + part_li.slice(1).join("/") + '")'
          )
        );
        return;
      }
      next();
    });
  }
});
