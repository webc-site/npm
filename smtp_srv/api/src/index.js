/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import router from "./router.js";

const AUTH_PREFIX = "Basic ",
  REALM = 'Basic realm="Access to SMTP API"';

export default {
  async fetch(request, env) {
    const auth = request.headers.get("Authorization");
    if (auth && auth.startsWith(AUTH_PREFIX)) {
      const credentials = atob(auth.slice(6)),
        idx = credentials.indexOf(":");
      if (idx !== -1) {
        const u = credentials.slice(0, idx),
          p = credentials.slice(idx + 1);
        if (u === env.SMTP_API_USER && p === env.SMTP_API_PASSWORD) {
          return router(request, env);
        }
      }
    }
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": REALM }
    });
  }
};
