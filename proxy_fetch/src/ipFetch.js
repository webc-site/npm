import int from "@3-/int";
import reqJson from "@3-/req/reqJson.js";
import split from "@3-/split";
import ipToU32 from "@1-/ipv4/ipv4_u32.js";

const PROXY_TYPE = ["socks5", "socks4", "http"],
  URL =
    "https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=json";

/*
获取免费代理并去重
返回值: [[u32, [proxy_type, port]], ...]
*/
export default async () => {
  const ip_map = new Map();
  let total = 0;

  for (;;) {
    const { proxies, shown_records, nextpage } = await reqJson(
      URL + (total ? "&skip=" + total : ""),
    );
    total += shown_records;
    for (const { proxy, anonymity } of proxies) {
      /* 只保留 elite 和 anonymous 高匿名代理 */
      if (["elite", "anonymous"].includes(anonymity)) {
        const pos = proxy.indexOf("://"),
          proxy_type = PROXY_TYPE.indexOf(proxy.slice(0, pos)),
          [ip, port_str] = split(proxy.slice(pos + 3), ":"),
          port = int(port_str),
          u32 = ipToU32(ip),
          pre = ip_map.get(u32);

        /* 优先保留协议更优的代理 */
        if (pre && pre[0] <= proxy_type) {
          continue;
        }
        ip_map.set(u32, [proxy_type, port]);
      }
    }
    if (!nextpage) {
      break;
    }
  }
  return [...ip_map];
};
