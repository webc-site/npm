import { expect, test } from "bun:test";
import psl from "../src/_.js";

const eq = (li) => li.forEach(([host, expected]) => expect(psl(host)).toBe(expected));

test("根域名提取", () => {
  eq([
    ["localhost", "localhost"],
    ["example.com", "example.com"],
    ["EXAMPLE.COM", "example.com"],
    ["www.example.com", "example.com"],
    ["a.b.example.com", "example.com"],
    ["foo.bar.co.uk", "bar.co.uk"],
    ["sub.city.kobe.jp", "city.kobe.jp"],
    ["Sub.City.KOBE.JP", "city.kobe.jp"],
    ["www.ck", "www.ck"],
    ["foo.ck", "foo.ck"],
    ["bar.foo.ck", "bar.foo.ck"],
    ["user.github.io", "user.github.io"],
    ["page.user.github.io", "user.github.io"],
    ["my-site.pages.dev", "my-site.pages.dev"],
    ["app.vercel.app", "app.vercel.app"],
    ["example.co.za", "example.co.za"],
    ["webc.site", "webc.site"],
    ["api.webc.site", "webc.site"],
    ["com", "com"],
    ["co.uk", "co.uk"]
  ]);
});

test("IP 地址与单段主机名", () => {
  eq([
    ["127.0.0.1", "127.0.0.1"],
    ["0.0.0.0", "0.0.0.0"],
    ["192.168.1.1", "192.168.1.1"],
    ["8.8.8.8", "8.8.8.8"],
    ["255.255.255.255", "255.255.255.255"],
    ["::1", "::1"],
    ["::", "::"],
    ["[::1]", "[::1]"],
    ["2001:db8::1", "2001:db8::1"],
    ["[2001:db8::1]", "[2001:db8::1]"],
    ["fe80::1", "fe80::1"],
    ["::ffff:127.0.0.1", "::ffff:127.0.0.1"],
    ["[::ffff:127.0.0.1]", "[::ffff:127.0.0.1]"]
  ]);
});
