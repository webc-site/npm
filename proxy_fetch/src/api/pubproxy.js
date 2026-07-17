import int from "@3-/int";
import ERR from "@3-/log/ERR.js";
import { myIps, pingProxy, KIND_TO_NAME, agentByProxy, request } from "../ping.js";

const URL =
    "http://pubproxy.com/api/proxy?format=json&https=true&level=elite&user_agent=true&limit=5",
  VERIFIED = new Set(),
  fetchOnce = async (proxy) => {
    let ok = false,
      data_str = "";
    if (proxy) {
      const [ip, type, port] = proxy,
        kind = KIND_TO_NAME.indexOf(type);
      if (kind !== -1) {
        const agent = agentByProxy(kind, ip, port);
        [ok, data_str] = await request(URL, { agent, timeout: 5000 });
      }
    } else {
      [ok, data_str] = await request(URL, { timeout: 5000 });
    }

    if (!ok) {
      if (data_str === "状态码 503") {
        const err = new Error("503");
        err.status = 503;
        throw err;
      }
      return [];
    }

    try {
      const { data } = JSON.parse(data_str);
      if (data && Array.isArray(data)) {
        return data.map(({ ip, type, port }) => [ip, type, int(port)]);
      }
    } catch (err) {
      ERR(err);
    }
    return [];
  };

export default async (proxy) => {
  const list = [],
    verified_proxies = proxy ? [proxy] : [],
    seen = new Set(),
    my_ips = await myIps();

  if (proxy) {
    const [ip, , port] = proxy,
      key = ip + ":" + port;
    seen.add(key);
    VERIFIED.add(key);
  }

  for (let i = 0; i < 50; ++i) {
    let agent_proxy = null;
    if (verified_proxies.length > 0) {
      agent_proxy = verified_proxies.pop();
    }

    let fetched = [];
    try {
      fetched = await fetchOnce(agent_proxy);
    } catch (err) {
      ERR(err);
      if (err?.status === 503) {
        break;
      }
      continue;
    }

    if (fetched.length === 0) {
      if (!agent_proxy) {
        break;
      }
      continue;
    }

    for (const item of fetched) {
      const [ip, , port] = item,
        key = ip + ":" + port;

      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }

    await Promise.allSettled(
      fetched.map(async (item) => {
        const [ip, type, port] = item,
          key = ip + ":" + port,
          kind = KIND_TO_NAME.indexOf(type);

        if (!VERIFIED.has(key) && kind !== -1) {
          try {
            const [is_ok] = await pingProxy(kind, ip, port, my_ips, 5000);
            if (is_ok) {
              console.log("验证成功: " + type + "://" + ip + ":" + port);
              VERIFIED.add(key);
              verified_proxies.push(item);
            }
          } catch (err) {
            ERR(err);
          }
        }
      })
    );
  }

  return list;
};
