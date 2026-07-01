import ipToU32 from "@1-/ipv4/ipv4_u32.js";
import proxyscrape from "./api/proxyscrape.js";
import pubproxy from "./api/pubproxy.js";

const PROXY_TYPE = ["socks5", "socks4", "http"],
  APIS = [proxyscrape, pubproxy];

/*
获取免费代理并去重
返回值: [[u32, [proxy_type, port]], ...]
*/
export default async () => {
  const ip_map = new Map(),
    results = await Promise.allSettled(APIS.map((api) => api()));

  for (const res of results) {
    if (res.status === "fulfilled") {
      for (const [ip, type, port] of res.value) {
        const proxy_type = PROXY_TYPE.indexOf(type);
        if (proxy_type !== -1) {
          const u32 = ipToU32(ip),
            pre = ip_map.get(u32);

          /* 优先保留协议更优的代理 */
          if (pre && pre[0] <= proxy_type) {
            continue;
          }
          ip_map.set(u32, [proxy_type, port]);
        }
      }
    }
  }
  return [...ip_map];
};
