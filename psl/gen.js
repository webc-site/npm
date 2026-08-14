#!/usr/bin/env bun

import { writeFileSync } from "fs";
import { join } from "path";
import ALLOW_PRIVATE from "./allow.js";

/*
从 Public Suffix List 下载数据（包含 ICANN DOMAINS 和常见的托管平台私有域名）并生成逆向 Trie 树
*/
const DAT_URL = "https://publicsuffix.org/list/public_suffix_list.dat",
  BEGIN_ICANN = "// ===BEGIN ICANN DOMAINS===",
  END_ICANN = "// ===END ICANN DOMAINS===",
  TYPE_NORMAL = 1,
  TYPE_WILDCARD = 2,
  TYPE_EXCEPTION = 3,
  res = await fetch(DAT_URL),
  txt = await res.text(),
  trie = {};

let is_icann = false;

for (let line of txt.split("\n")) {
  line = line.trim();
  if (line === BEGIN_ICANN) {
    is_icann = true;
    continue;
  }
  if (line === END_ICANN) is_icann = false;
  if (!line || line.startsWith("//")) continue;
  if (!is_icann && !ALLOW_PRIVATE.has(line)) continue;

  let type = TYPE_NORMAL;
  if (line.startsWith("!")) {
    type = TYPE_EXCEPTION;
    line = line.slice(1);
  } else if (line.startsWith("*.")) {
    type = TYPE_WILDCARD;
    line = line.slice(2);
  }
  let curr = trie;
  for (const p of line.split(".").reverse()) curr = curr[p] = curr[p] || {};
  curr["$"] = type;
}

/*
压缩 Trie 节点：
叶节点：仅类型数字 (1: 普通, 2: 通配符, 3: 例外)
带子节点：类型 0 存为对象 { key: node }，非 0 存为数组 [type, { key: node }]
*/
const compress = (node) => {
    const type = node["$"] || 0;
    delete node["$"];
    const keys = Object.keys(node);
    if (!keys.length) return type;
    const children = {};
    for (const k of keys) children[k] = compress(node[k]);
    return type ? [type, children] : children;
  },
  fp = join(import.meta.dirname, "src/psl.js"),
  code = "export default " + JSON.stringify(compress(trie)) + ";\n";

writeFileSync(fp, code);
