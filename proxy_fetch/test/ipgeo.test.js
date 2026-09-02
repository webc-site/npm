import { expect, test } from "bun:test";
import { parseIpGeo, myIps, request, API_LIST } from "../src/ping.js";

test("解析 ipgeo 数据", () => {
  const cases = [
    [
      "http://ip-api.com/json?lang=zh-CN",
      JSON.stringify({
        status: "success",
        query: "1.2.3.4",
        country: "中国",
        regionName: "北京",
        city: "北京"
      }),
      ["1.2.3.4", "中国 北京 北京"]
    ],
    [
      "https://ipapi.co/json/",
      JSON.stringify({
        ip: "2.3.4.5",
        country_name: "United States",
        region: "California",
        city: "San Francisco"
      }),
      ["2.3.4.5", "United States California San Francisco"]
    ],
    [
      "https://ipinfo.io/json",
      JSON.stringify({
        ip: "3.4.5.6",
        country: "JP",
        region: "Tokyo",
        city: "Tokyo"
      }),
      ["3.4.5.6", "JP Tokyo Tokyo"]
    ],
    ["http://ip-api.com/json?lang=zh-CN", JSON.stringify({ status: "fail" }), []]
  ];

  cases.forEach(([url, data, expected]) => {
    expect(parseIpGeo(url, data)).toEqual(expected);
  });
});

test("逐一真实请求并解析 IPGeo 网站", async () => {
  let success_count = 0;
  for (const [url] of API_LIST) {
    const [ok, data] = await request(url, { timeout: 8000 });
    if (ok) {
      const [ip, geo] = parseIpGeo(url, data);
      console.log("真实请求成功 | " + url + " -> IP: " + ip + ", GEO: " + geo);
      if (ip) {
        expect(ip).toMatch(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);
        success_count += 1;
      }
    } else {
      console.log("真实请求失败或超时 | " + url + " -> 错误信息: " + data);
    }
  }
  // 保证至少有一个接口请求和解析成功，避免所有接口同时挂掉或格式不对
  expect(success_count).toBeGreaterThan(0);
}, 30000);

test("获取本机出口 IP (综合接口)", async () => {
  const ips = await myIps();
  expect(ips.size).toBeGreaterThan(0);
  for (const ip of ips) {
    expect(ip).toMatch(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);
  }
}, 10000);
