use std::env;

use reqwest::Proxy;

const HTTPS_PROXY: [&str; 2] = ["https_proxy", "HTTPS_PROXY"];
const HTTP_PROXY: [&str; 2] = ["http_proxy", "HTTP_PROXY"];
const ALL_PROXY: [&str; 2] = ["all_proxy", "ALL_PROXY"];

fn add_proxy(
  mut builder: reqwest::ClientBuilder,
  vars: &[&str],
  f: fn(String) -> Result<Proxy, reqwest::Error>,
) -> reqwest::ClientBuilder {
  if let Some(proxy) = vars
    .iter()
    .filter_map(|&var| env::var(var).ok())
    .filter_map(|url| f(url).ok())
    .next()
  {
    builder = builder.proxy(proxy);
  }
  builder
}

pub fn proxy(builder: reqwest::ClientBuilder) -> reqwest::ClientBuilder {
  let builder = add_proxy(builder, &HTTPS_PROXY, Proxy::https);
  let builder = add_proxy(builder, &HTTP_PROXY, Proxy::http);
  add_proxy(builder, &ALL_PROXY, Proxy::all)
}
