import { env as process_env } from "node:process";
import cluster from "./cluster.js";
import sentinel from "./sentinel.js";
import one from "./one.js";
import nodeSplit from "./nodeSplit.js";

const ERR_MISS_NODE = 1;

/*
根据环境变量字典配置返回 Redis/Cluster 实例
env: 环境变量对象，默认 process.env
prefix: 环境变量前缀，默认 "R"
返回: Redis/Cluster 实例
*/
export default (env = process_env, prefix = "R") => {
  const read = (name) => env[prefix + "_" + name]?.trim(),
    node = read("NODE"),
    password = read("PASSWORD"),
    sentinel_name = read("SENTINEL_NAME");

  if (!node) {
    throw new Error(ERR_MISS_NODE + " : " + prefix + "_NODE");
  }

  if (sentinel_name) {
    return sentinel(nodeSplit(node), sentinel_name, read("SENTINEL_PASSWORD"), password);
  }

  if (node.includes(" ")) {
    return cluster(nodeSplit(node), password);
  }

  const [host, port] = node.split(":");
  return one(host, port || 6379, password, read("DB"));
};
