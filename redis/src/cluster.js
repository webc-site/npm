import redis from "./redis.js";

/*
node_li: 节点地址列表
password: 密码
返回: Cluster 实例
*/
export default (node_li, password) =>
  redis({
    nodes: node_li,
    password,
  });
