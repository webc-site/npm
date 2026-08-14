import int from "@3-/int";

/*
nodes: 空格分隔的节点地址字符串，如 "ip:port ip:port"
default_port: 默认端口数字
返回 [[host, port], ...]
*/
export default (nodes, default_port) =>
  nodes.split(" ").map((item) => {
    const [host, port] = item.split(":");
    return [host, port ? int(port) : default_port];
  });
