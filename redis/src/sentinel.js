import redis from "./redis.js";

/*
node_li: 哨兵节点列表
name: 主节点名
sentinel_password: 哨兵密码
password: 密码
返回: 绑定的 Redis 实例
*/
export default (node_li, name, sentinel_password, password) =>
  redis({
    sentinels: node_li.map(([host, port]) => ({ host, port })),
    name,
    sentinelPassword: sentinel_password,
    password
  });
