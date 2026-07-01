import reqJson from "@3-/req/reqJson.js";
import split from "@3-/split";
import int from "@3-/int";

const URL =
  "https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=json";

export default async () => {
  const list = [];
  let total = 0;

  for (;;) {
    const {
      proxies,
      shown_records,
      nextpage: next_page,
    } = await reqJson(URL + (total ? "&skip=" + total : ""));
    total += shown_records;
    for (const { proxy, anonymity } of proxies) {
      if (["elite", "anonymous"].includes(anonymity)) {
        const pos = proxy.indexOf("://"),
          type = proxy.slice(0, pos),
          [ip, port_str] = split(proxy.slice(pos + 3), ":");
        list.push([ip, type, int(port_str)]);
      }
    }
    if (!next_page) {
      break;
    }
  }
  return list;
};
