CREATE TABLE `proxy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `ipv4` int unsigned NOT NULL COMMENT 'IPv4地址（32位无符号整数）',
  `port` smallint unsigned NOT NULL COMMENT '端口号',
  `kind` tinyint NOT NULL COMMENT '代理类型: 0=socks5, 1=socks4, 2=http',
  `oked` bigint unsigned NOT NULL DEFAULT '0' COMMENT '成功次数',
  `failed` bigint unsigned NOT NULL DEFAULT '0' COMMENT '失败次数',
  `rank` bigint unsigned NOT NULL DEFAULT '0' COMMENT '排序得分，分数越高越优质',
  `cts` bigint unsigned NOT NULL DEFAULT '0' COMMENT '创建的时间戳',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_rank` (`rank`),
  UNIQUE KEY `uk_ipv4` (`ipv4`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
