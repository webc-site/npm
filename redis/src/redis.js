import Redis from "ioredis";

/*
config: 合并并返回 ioredis 配置项
default: 根据 opt 创建并返回绑定了回收方法的 Redis 或 Cluster 实例
*/

export const config = (opt) => {
  const redis_opt = {
    retryStrategy: (times) =>
      times > 6 ? new Error("ioredis can't connect " + JSON.stringify(redis_opt, null, 2)) : 1e3,
    enableAutoPipelining: true,
    enableOfflineQueue: true,
    keepAlive: 1e4,
    connectTimeout: 5e3,
    dropBufferSupport: true,
    maxRetriesPerRequest: 3,
    ...opt,
  };
  return redis_opt;
};

export default (opt) => {
  const { nodes, ...rest } = opt,
    redis = nodes
      ? new Redis.Cluster(
          nodes.map(([host, port]) => ({ host, port })),
          { redisOptions: config(rest) },
        )
      : new Redis(config(rest)),
    disconnect = redis.disconnect.bind(redis);

  redis[Symbol.asyncDispose] = redis[Symbol.dispose] = disconnect;
  return redis;
};
