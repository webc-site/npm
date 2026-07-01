import read from "@3-/read";
import { parseEnv } from "node:util";
import envConn from "./env.js";

export { default as env } from "./env.js";

/*
解析 env 配置文件并返回 Redis/Cluster 实例
path: 配置文件路径
prefix: 环境变量前缀，默认 "R"
返回: Redis/Cluster 实例
*/
export default (path, prefix = "R") => envConn(parseEnv(read(path)), prefix);
