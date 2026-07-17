#![cfg_attr(docsrs, feature(doc_cfg))]

use std::{env, path::PathBuf};

use aok::Result;
use err_exit::err_exit;
pub use fred;
use fred::{
  interfaces::ClientLike,
  prelude::{Client, Config, ReconnectPolicy, Server as FredServer, ServerConfig},
  types::RespVersion,
};

#[cfg(feature = "macro")]
mod r#macro;

#[cfg(feature = "macro")]
mod macro_pub_use {
  pub use log;
  pub use tokio;
  pub use xboot;
}

#[cfg(feature = "macro")]
pub use macro_pub_use::*;

#[cfg(feature = "r")]
mod r;

#[cfg(feature = "r")]
pub use r::R;

pub struct Server;

impl Server {
  pub fn unix_sock(path: impl Into<PathBuf>) -> ServerConfig {
    ServerConfig::Unix { path: path.into() }
  }

  pub fn cluster(hosts: Vec<FredServer>) -> ServerConfig {
    ServerConfig::Clustered {
      hosts,
      policy: Default::default(),
    }
  }

  pub fn sentinel(
    service_name: impl Into<String>,
    hosts: Vec<FredServer>,
    username: Option<String>,
    password: Option<String>,
  ) -> ServerConfig {
    ServerConfig::Sentinel {
      service_name: service_name.into(),
      hosts,
      username: Some(username.unwrap_or_else(|| "default".to_string())),
      password,
    }
  }

  pub fn centralized(server: FredServer) -> ServerConfig {
    ServerConfig::Centralized { server }
  }
}

const USER: &str = "USER";
const NODE: &str = "NODE";
const PASSWORD: &str = "PASSWORD";
const DB: &str = "DB";
const SENTINEL_NAME: &str = "SENTINEL_NAME";
const SENTINEL_PASSWORD: &str = "SENTINEL_PASSWORD";
const SENTINEL_USER: &str = "SENTINEL_USER";
const SENTINEL_PORT: &str = "SENTINEL_PORT";
const RESP: &str = "RESP";

const DEFAULT_REDIS_PORT: u16 = 6379;
const DEFAULT_SENTINEL_PORT: u16 = 26379;
const RECONNECT_MAX_ATTEMPTS: u32 = u32::MAX;
const RECONNECT_MAX_DELAY_SEC: u32 = 8;
const RECONNECT_INITIAL_DELAY_SEC: u32 = 1;

pub fn server_li(host_port: impl AsRef<str>, default_port: u16) -> Vec<FredServer> {
  host_port
    .as_ref()
    .split_whitespace()
    .map(|i| {
      if let Some((host, port_str)) = i.rsplit_once(':') {
        let port = port_str.parse::<u16>().unwrap_or(default_port);
        FredServer::new(host, port)
      } else {
        FredServer::new(i, default_port)
      }
    })
    .collect()
}

pub async fn conn(prefix: impl AsRef<str>) -> Result<Client> {
  let prefix = prefix.as_ref();

  let mut key_buf = String::with_capacity(prefix.len() + 1 + 32);
  let mut get_env = |name: &str| -> Option<String> {
    key_buf.clear();
    key_buf.push_str(prefix);
    key_buf.push('_');
    key_buf.push_str(name);
    env::var(&key_buf)
      .ok()
      .map(|s| s.trim().to_owned())
      .filter(|s| !s.is_empty())
  };

  let host_port = get_env(NODE).unwrap_or_else(|| err_exit!("xkv : miss env {}_{}", prefix, NODE));

  let server = if let Some(sentinel_name) = get_env(SENTINEL_NAME) {
    let sentinel_port = get_env(SENTINEL_PORT)
      .map(|i| {
        i.parse::<u16>().unwrap_or_else(|_| {
          err_exit!("xkv : invalid SENTINEL_PORT '{}' for prefix {}", i, prefix)
        })
      })
      .unwrap_or(DEFAULT_SENTINEL_PORT);

    Server::sentinel(
      sentinel_name,
      server_li(host_port, sentinel_port),
      get_env(SENTINEL_USER),
      get_env(SENTINEL_PASSWORD),
    )
  } else if host_port.starts_with('/') {
    Server::unix_sock(host_port)
  } else {
    let mut hosts = server_li(host_port, DEFAULT_REDIS_PORT);
    if hosts.len() == 1 {
      Server::centralized(hosts.pop().unwrap())
    } else {
      Server::cluster(hosts)
    }
  };

  let database = get_env(DB).map(|s| {
    s.parse::<u8>()
      .unwrap_or_else(|_| err_exit!("xkv : invalid DB value '{}' for prefix {}", s, prefix))
  });
  let user = get_env(USER);
  let password = get_env(PASSWORD);
  let resp = get_env(RESP);

  connect(&server, user, password, database, resp.as_deref()).await
}

pub async fn connect(
  server: &ServerConfig,
  username: Option<String>,
  password: Option<String>,
  database: Option<u8>,
  resp: Option<&str>,
) -> Result<Client> {
  let mut conf = Config {
    version: if resp == Some("2") {
      RespVersion::RESP2
    } else {
      RespVersion::RESP3
    },
    ..Default::default()
  };
  conf.server = server.clone();
  conf.username = username;
  conf.password = password;
  conf.database = database;

  let policy = ReconnectPolicy::new_linear(
    RECONNECT_MAX_ATTEMPTS,
    RECONNECT_MAX_DELAY_SEC,
    RECONNECT_INITIAL_DELAY_SEC,
  );
  let client = Client::new(conf, None, None, Some(policy));
  client.init().await?;
  Ok(client)
}
