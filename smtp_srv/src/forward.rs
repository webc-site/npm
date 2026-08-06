use aok::Result;
use fred::interfaces::FunctionInterface;
use mail_struct::HostUserLi;
use xkv::R;
use xmail::norm_user_host;

use crate::r;

#[derive(Clone)]
pub struct Forward;

async fn forward(user: impl AsRef<str>, host: impl AsRef<str>) -> Result<Option<String>> {
  let key = r::mail_forward_key(host.as_ref());
  Ok(
    R.fcall_ro(r::MAIL_FORWARD, &key[..], &[user.as_ref()])
      .await?,
  )
}

impl mail_forward::Forward for Forward {
  async fn forward(&self, mail: &str) -> Result<Option<String>> {
    if let Some((user, host)) = norm_user_host(mail) {
      return forward(user, host).await;
    }
    Ok(None)
  }

  async fn forward_set(&self, mail_li: &[String]) -> Result<Vec<String>> {
    let host_user_li = HostUserLi::from_iter(mail_li);
    let len = host_user_li.len();
    Ok(if len == 0 {
      Vec::new()
    } else if len == 1
      && let Some((host, mail_li)) = host_user_li.iter().next()
    {
      if mail_li.len() == 1
        && let Some(user) = mail_li.iter().next()
      {
        if let Some(r) = forward(user, host).await? {
          vec![r]
        } else {
          Vec::new()
        }
      } else {
        let key = r::mail_forward_key(host);
        R.fcall_ro(
          r::MAIL_FORWARD_SET,
          &key[..],
          mail_li.iter().collect::<Vec<_>>(),
        )
        .await?
      }
    } else {
      let p = R.pipeline();
      for (host, mail_li) in host_user_li.iter() {
        let key = r::mail_forward_key(host);
        let _: () = p
          .fcall_ro(
            r::MAIL_FORWARD_SET,
            &key[..],
            mail_li.iter().collect::<Vec<_>>(),
          )
          .await?;
      }
      let all_li: Vec<Vec<String>> = p.all().await?;
      all_li.into_iter().flatten().collect()
    })
  }
}
