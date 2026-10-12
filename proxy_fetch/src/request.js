import { SocksClient } from "socks";
import { connect as netConnect } from "node:net";
import { connect as tlsConnect } from "node:tls";

/*
根据代理配置建立 Socket 物理连接
参数:
  proxy: 代理信息 { kind, ip, port }，为 null 则直连
  host, port: 目标地址与端口
  is_https: 是否为 HTTPS 目标
返回值: 已连接（若为 HTTPS 则已握手）的 Socket
*/
const socketByProxy = async (proxy, host, port, is_https) => {
  let socket;
  if (!proxy) {
    socket = netConnect(port, host);
    if (is_https) {
      await new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("error", reject);
      });
    }
  } else if (proxy.kind === 0 || proxy.kind === 1) {
    const { socket: s } = await SocksClient.createConnection({
      proxy: {
        host: proxy.ip,
        port: proxy.port,
        type: proxy.kind === 0 ? 5 : 4
      },
      command: "connect",
      destination: { host, port }
    });
    socket = s;
  } else {
    socket = netConnect(proxy.port, proxy.ip);
    if (is_https) {
      await new Promise((resolve, reject) => {
        let data = "";
        const onConnect = () => {
            socket.write(
              "CONNECT " +
                host +
                ":" +
                port +
                " HTTP/1.1\r\nHost: " +
                host +
                ":" +
                port +
                "\r\n\r\n"
            );
          },
          onData = (chunk) => {
            data += chunk.toString();
            if (data.includes("\r\n\r\n")) {
              socket.off("data", onData);
              socket.off("error", onError);
              socket.off("connect", onConnect);
              if (data.startsWith("HTTP/1.1 200") || data.startsWith("HTTP/1.0 200")) {
                resolve();
              } else {
                reject(new Error("HTTP Proxy tunnel failed: " + data.split("\r\n")[0]));
              }
            }
          },
          onError = (err) => {
            socket.off("data", onData);
            socket.off("connect", onConnect);
            reject(err);
          };
        socket.on("data", onData);
        socket.on("error", onError);
        if (socket.writable) {
          onConnect();
        } else {
          socket.once("connect", onConnect);
        }
      });
    }
  }
  return is_https ? tlsConnect({ socket, servername: host, rejectUnauthorized: false }) : socket;
};

/*
使用指定代理发起 HTTP/HTTPS 请求
参数:
  url: 请求目标地址
  options: 配置选项 { agent, timeout }
返回值: [ok_flag, body_data, latency, err_msg]
*/
export default (url, options = {}) => {
  let proxy = null;
  const { agent } = options;
  if (agent && agent.proxy) {
    const { proxy: ap } = agent;
    proxy =
      typeof ap.type === "number"
        ? { kind: ap.type === 5 ? 0 : 1, ip: ap.host, port: ap.port }
        : { kind: 2, ip: ap.hostname, port: parseInt(ap.port, 10) };
  }

  const { protocol, hostname, pathname, search, port } = new URL(url),
    is_https = protocol === "https:",
    target_port = port ? parseInt(port, 10) : is_https ? 443 : 80,
    path = pathname + search,
    timeout = options.timeout || 9000;

  return new Promise((resolve) => {
    (async () => {
      let socket;
      const timer = setTimeout(() => {
          if (socket) {
            socket.destroy();
          }
          resolve([false, "超时", 0, ""]);
        }, timeout),
        start = Date.now();

      try {
        socket = await socketByProxy(proxy, hostname, target_port, is_https);
        socket.on("error", (err) => {
          clearTimeout(timer);
          resolve([false, err.message, 0, ""]);
        });

        const req_path = proxy && proxy.kind === 2 && !is_https ? url : path,
          req_payload =
            "GET " +
            req_path +
            " HTTP/1.1\r\n" +
            "Host: " +
            hostname +
            "\r\n" +
            "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n" +
            "Connection: close\r\n\r\n";

        socket.write(req_payload);

        let res_data = "";
        socket.on("data", (chunk) => {
          res_data += chunk.toString("utf8");
        });

        socket.on("end", () => {
          clearTimeout(timer);
          const header_end = res_data.indexOf("\r\n\r\n");
          if (header_end === -1) {
            resolve([false, "无效响应", 0, ""]);
            return;
          }
          const headers = res_data.slice(0, header_end),
            body = res_data.slice(header_end + 4),
            status_line = headers.slice(0, headers.indexOf("\r\n")),
            status_code = parseInt(status_line.split(" ")[1], 10);

          if (status_code === 200) {
            resolve([true, body, Date.now() - start, ""]);
          } else {
            resolve([false, "状态码 " + status_code, 0, ""]);
          }
        });
      } catch (err) {
        clearTimeout(timer);
        resolve([false, err.message, 0, ""]);
      }
    })();
  });
};
