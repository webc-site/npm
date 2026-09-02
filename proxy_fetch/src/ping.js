import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import u32ToIp from "@1-/ipv4/u32_ipv4.js";
import request from "./request.js";

export { request };

let my_ips_promise = null;

export const HTTP = 2,
  KIND_TO_NAME = ["socks5", "socks4", "http"],
  IP_REG = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
  ERR_EXPOSE_IP = 1,
  ERR_FAILED = 2;

const joinGeo = (country, region, city) =>
    (country || "") + " " + (region || "") + " " + (city || ""),
  verifyIpGeo = (ip, country, region, city) =>
    IP_REG.test(ip) ? [ip, joinGeo(country, region, city)] : [];

export const API_LIST = [
    [
      "http://ip-api.com/json?lang=zh-CN",
      (data) => {
        const { status, query, country, regionName, city } = JSON.parse(data);
        return status === "success" ? verifyIpGeo(query, country, regionName, city) : [];
      }
    ],
    [
      "https://ipapi.co/json/",
      (data) => {
        const { ip, country_name, region, city } = JSON.parse(data);
        return verifyIpGeo(ip, country_name, region, city);
      }
    ],
    [
      "https://ipinfo.io/json",
      (data) => {
        const { ip, country, region, city } = JSON.parse(data);
        return verifyIpGeo(ip, country, region, city);
      }
    ]
  ],
  parseIpGeo = (url, data) => {
    const item = API_LIST.find(([u]) => u === url);
    if (item) {
      const [, parser] = item;
      try {
        return parser(data);
      } catch {}
    }
    return [];
  },
  agentByProxy = (kind, ip_str, port) => {
    const url = KIND_TO_NAME[kind] + "://" + ip_str + ":" + port;
    return kind === HTTP ? new HttpProxyAgent(url) : new SocksProxyAgent(url);
  },
  myIps = () => {
    if (!my_ips_promise) {
      my_ips_promise = (async () => {
        const ips = new Set();
        await Promise.all(
          API_LIST.map(async ([url]) => {
            const [ok, data] = await request(url, { timeout: 5000 });
            if (ok) {
              const [ip] = parseIpGeo(url, data);
              if (ip) {
                ips.add(ip);
              }
            }
          })
        );
        return ips;
      })();
    }
    return my_ips_promise;
  },
  ping = async (agent, my_ips, timeout = 9000) => {
    for (const [url] of API_LIST) {
      const [ok, data, latency] = await request(url, { agent, timeout });
      if (ok) {
        const [exit_ip, geo] = parseIpGeo(url, data);
        if (exit_ip) {
          if (my_ips && my_ips.has(exit_ip)) {
            return [false, ERR_EXPOSE_IP, 0, ""];
          }
          return [true, exit_ip, latency, geo];
        }
      }
    }
    return [false, ERR_FAILED, 0, ""];
  },
  pingProxy = async (kind, ip_u32_or_str, port, my_ips, timeout = 9000) => {
    const ip_str = typeof ip_u32_or_str === "number" ? u32ToIp(ip_u32_or_str) : ip_u32_or_str;
    return await ping(agentByProxy(kind, ip_str, port), my_ips, timeout);
  };
