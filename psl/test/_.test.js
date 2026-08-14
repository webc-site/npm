import { expect, test } from "bun:test";
import tld from "../src/_.js";

const eq = (list) => list.forEach(([host, expected]) => expect(tld(host)).toBe(expected)),
  isUndef = (list) => list.forEach((host) => expect(tld(host)).toBeUndefined());

test("TLD 提取", () => {
  eq([
    ["localhost", "localhost"],
    ["example.com", "com"],
    ["EXAMPLE.COM", "com"],
    ["foo.bar.co.uk", "co.uk"],
    ["sub.city.kobe.jp", "kobe.jp"],
    ["Sub.City.KOBE.JP", "kobe.jp"],
    ["www.ck", "ck"],
    ["foo.ck", "foo.ck"],
    ["user.github.io", "github.io"],
    ["my-site.pages.dev", "pages.dev"],
    ["app.vercel.app", "vercel.app"],
    ["example.co.za", "co.za"]
  ]);

  isUndef(["foo.invalid", "test.za"]);
});

test("IP 地址", () => {
  eq([
    ["::1", "::1"],
    ["::", "::"],
    ["[::1]", "[::1]"],
    ["2001:db8::1", "2001:db8::1"],
    ["[2001:db8::1]", "[2001:db8::1]"],
    ["fe80::1", "fe80::1"]
  ]);

  isUndef([
    "127.0.0.1",
    "0.0.0.0",
    "192.168.1.1",
    "8.8.8.8",
    "255.255.255.255",
    "::ffff:127.0.0.1",
    "[::ffff:127.0.0.1]"
  ]);
});
