use std::{
  fmt::Write,
  time::{Duration, Instant},
};

use bytes::Bytes;
use log::{error, info};
use reqer::Response;
use serde::{Deserialize, Serialize, de::DeserializeOwned};

use crate::{
  Error, Result, Sur,
  cbor::{decode, encode},
  consts::{
    ACCEPT, APPLICATION_CBOR, AUTHORIZATION, CONTENT_TYPE, ERR, QUERY, SURREAL_DB, SURREAL_NS,
  },
};

#[derive(Serialize)]
struct RpcQueryReq<'a, P: Serialize + ?Sized> {
  id: &'a str,
  method: &'a str,
  params: (&'a str, &'a P),
}

#[derive(Deserialize, Debug)]
#[serde(bound(deserialize = "T: DeserializeOwned"))]
pub struct QueryItem<T> {
  pub status: String,
  pub time: Option<String>,
  pub result: Option<T>,
  pub detail: Option<String>,
}

#[derive(Deserialize)]
#[serde(bound(deserialize = "T: DeserializeOwned"))]
struct RpcQueryRes<T> {
  result: Option<Vec<QueryItem<T>>>,
  error: Option<RpcQueryErr>,
}

#[derive(Deserialize, Debug)]
struct RpcQueryErr {
  message: String,
}

#[derive(Clone)]
pub struct Db {
  pub sur: Sur,
  pub db: String,
}

#[inline]
fn fmt_duration(d: Duration) -> String {
  let micros = d.as_micros();
  if micros < 1000 {
    format!("{micros}µs")
  } else {
    format!("{}ms", (micros + 500) / 1000)
  }
}

fn append_round_time(out: &mut String, s: &str) {
  if let Some(pos) = s.find(|c: char| !c.is_ascii_digit() && c != '.') {
    let (num_str, unit) = s.split_at(pos);
    if let Ok(num) = num_str.parse::<f64>() {
      let _ = write!(out, "{}{unit}", num.round() as u64);
      return;
    }
  }
  out.push_str(s);
}

impl Db {
  pub fn new(sur: Sur, database: impl AsRef<str>) -> Self {
    Self {
      sur,
      db: database.as_ref().to_string(),
    }
  }

  #[inline]
  pub fn db(&self, database: impl AsRef<str>) -> Self {
    self.sur.db(database)
  }

  async fn req_raw(&self, payload: Bytes, force_auth: bool) -> Result<Response> {
    let state = self.sur.auth_state(force_auth).await?;

    let mut req = self
      .sur
      .http
      .post(&self.sur.rpc_url)
      .header(CONTENT_TYPE, APPLICATION_CBOR)
      .header(ACCEPT, APPLICATION_CBOR)
      .header(AUTHORIZATION, &state.header);

    if let Some(ref ns) = self.sur.ns {
      req = req.header(SURREAL_NS, ns);
    }

    req = req.header(SURREAL_DB, &self.db);

    req.body(payload).send().await.map_err(Error::Http)
  }

  pub(crate) async fn req(&self, payload: Bytes) -> Result<Response> {
    let mut resp = self.req_raw(payload.clone(), false).await?;

    if resp.status == 401 {
      resp = self.req_raw(payload, true).await?;
    }

    Ok(resp)
  }

  async fn query<P: Serialize + ?Sized>(&self, sql: &str, params: &P) -> Result<Response> {
    let payload: Bytes = encode(&RpcQueryReq {
      id: "q",
      method: QUERY,
      params: (sql, params),
    })?
    .into();

    self.req(payload).await
  }

  pub async fn query_raw<T: DeserializeOwned, P: Serialize + ?Sized>(
    &self,
    sql: impl AsRef<str>,
    params: &P,
  ) -> Result<Vec<QueryItem<T>>> {
    let sql_str = sql.as_ref();
    let start = Instant::now();
    let resp = self.query(sql_str, params).await?;

    let status = resp.status;
    if !resp.is_success() {
      let txt = resp.text().await.unwrap_or_default();
      error!(
        "{} | HTTP {status}: {txt} | {sql_str}",
        fmt_duration(start.elapsed())
      );
      return Err(Error::Status(status, txt));
    }

    let bytes = resp.bytes().await?;
    let data: RpcQueryRes<T> = decode(&bytes)?;

    if let Some(err) = data.error {
      error!(
        "{} | RPC: {} | {sql_str}",
        fmt_duration(start.elapsed()),
        err.message
      );
      return Err(Error::Rpc(err.message));
    }

    let items = data
      .result
      .ok_or_else(|| Error::Rpc("empty query result".to_string()))?;

    let elapsed = start.elapsed();
    let time_info = if items.iter().any(|i| i.time.is_some()) {
      let mut s = format!("{} (srv ", fmt_duration(elapsed));
      let mut first = true;
      for item in &items {
        if let Some(ref t) = item.time {
          if !first {
            s.push_str(", ");
          }
          first = false;
          append_round_time(&mut s, t);
        }
      }
      s.push(')');
      s
    } else {
      fmt_duration(elapsed)
    };

    let len = items.len();
    info!("{time_info} | {sql_str} → {len} items");

    Ok(items)
  }

  pub async fn q<T: DeserializeOwned, P: Serialize + ?Sized>(
    &self,
    sql: impl AsRef<str>,
    params: &P,
  ) -> Result<Vec<T>> {
    let items: Vec<QueryItem<T>> = self.query_raw(sql, params).await?;
    let mut out = Vec::with_capacity(items.len());
    for item in items {
      if item.status == ERR {
        let msg = item
          .detail
          .unwrap_or_else(|| "query execution failed".to_string());
        error!("query item error: {msg}");
        return Err(Error::Query(msg));
      }
      if let Some(res) = item.result {
        out.push(res);
      }
    }
    Ok(out)
  }

  #[inline]
  pub async fn q1<T: DeserializeOwned, P: Serialize + ?Sized>(
    &self,
    sql: impl AsRef<str>,
    params: &P,
  ) -> Result<Option<T>> {
    let vec: Vec<T> = self.q(sql, params).await?;
    Ok(vec.into_iter().next())
  }
}
