use std::sync::Arc;

use arc_swap::ArcSwap;
use reqer::Client;

use crate::{
  Result,
  auth::{TokenState, signin},
  db::Db,
};

#[derive(Clone)]
pub struct Sur {
  pub(crate) http: Client,
  pub(crate) rpc_url: String,
  pub(crate) user: String,
  pub(crate) pass: String,
  pub(crate) ns: Option<String>,
  pub(crate) token_state: Arc<ArcSwap<TokenState>>,
}

impl Sur {
  pub fn open(
    url: impl AsRef<str>,
    user: impl AsRef<str>,
    pass: impl AsRef<str>,
    namespace: Option<impl AsRef<str>>,
  ) -> Self {
    let url_str = url.as_ref();
    let rpc_url = if url_str.ends_with("/rpc") {
      url_str.to_string()
    } else {
      format!("{}/rpc", url_str.trim_end_matches('/'))
    };

    let user = user.as_ref().to_string();
    let pass = pass.as_ref().to_string();
    let ns = namespace.map(|s| s.as_ref().to_string());

    Self {
      http: Client::new(),
      rpc_url,
      user,
      pass,
      ns,
      token_state: Arc::new(ArcSwap::from_pointee(TokenState::default())),
    }
  }

  #[inline]
  pub fn db(&self, database: impl AsRef<str>) -> Db {
    Db::new(self.clone(), database)
  }

  #[inline]
  pub(crate) async fn auth_state(&self, force: bool) -> Result<Arc<TokenState>> {
    let now = ts_::sec();
    if !force {
      let state = self.token_state.load_full();
      if !state.token.is_empty() && now < state.expire_at {
        return Ok(state);
      }
    }

    let signin_ns = if self.user == "root" {
      None
    } else {
      self.ns.as_deref()
    };

    let (token, header, expire_at) =
      signin(&self.http, &self.rpc_url, &self.user, &self.pass, signin_ns).await?;

    let state = Arc::new(TokenState {
      token,
      header,
      expire_at,
    });
    self.token_state.store(state.clone());
    Ok(state)
  }

  #[inline]
  pub async fn auth(&self, force: bool) -> Result<String> {
    Ok(self.auth_state(force).await?.token.clone())
  }
}

#[inline]
pub fn open(
  url: impl AsRef<str>,
  user: impl AsRef<str>,
  pass: impl AsRef<str>,
  namespace: Option<impl AsRef<str>>,
) -> Sur {
  Sur::open(url, user, pass, namespace)
}
