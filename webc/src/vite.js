import { createServer } from "vite";
import openBrowser from "./lib/open.js";
import stylusPlugin from "./vite/stylus.js";
import vurl from "./vite/vurl.js";
import i18n from "./vite/i18n.js";
import pugPlugin from "./vite/pug.js";
import define from "./lib/define.js";

export default async (root, host, port, matched_name, component_li, open_host) => {
  const server = await createServer({
    root,
    server: {
      host,
      port,
      strictPort: true
    },
    define: await define(root, true),
    plugins: [stylusPlugin(), vurl(matched_name, component_li, pugPlugin(root)), i18n()]
  });

  await server.listen();
  const url = "http://" + open_host + ":" + port + "/" + matched_name;
  console.log(url);
  await openBrowser(url);
};
