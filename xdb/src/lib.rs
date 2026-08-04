#![cfg_attr(docsrs, feature(doc_cfg))]

use mysql_async::{OptsBuilder, Pool, SslOpts};

pub fn pool(
  host: &str,
  port: u16,
  user: Option<&str>,
  pass: Option<&str>,
  db_name: Option<&str>,
) -> Pool {
  let ssl_opts = SslOpts::default().with_danger_accept_invalid_certs(true);

  let opts = OptsBuilder::default()
    .ip_or_hostname(host)
    .tcp_port(port)
    .user(user)
    .pass(pass)
    .db_name(db_name)
    .ssl_opts(Some(ssl_opts));

  Pool::new(opts)
}

#[cfg(feature = "xboot")]
mod xboot;

#[cfg(feature = "xboot")]
pub use xboot::DB;
