import int from "@3-/int";
import redis from "./redis.js";

/*
参数 host 主机，port 端口，password 密码，db 数据库
返回 绑定的 Redis 实例
*/
export default (host, port, password, db) =>
  redis({
    host,
    port: int(port),
    password,
    db: db ? int(db) : undefined,
  });
