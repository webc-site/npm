use fred::interfaces::KeysInterface;
use mail_send::mail_builder::{MessageBuilder, headers::address::Address};
use mail_struct::Mail;
use xkv::R;
use xmail::norm_user_host;

use crate::{
  api::{Error, Result, extractor::Json},
  auth::verify_user,
  mailer::sign_and_send,
  r::DKIM_SK,
};

pub async fn send(
  Json([email, password, sender_name, to, title, txt, html]): Json<[String; 7]>,
) -> Result<()> {
  if password.is_empty() || to.is_empty() {
    return Err(Error::BadRequest);
  }

  let Some((prefix, domain)) = norm_user_host(&email) else {
    return Err(Error::BadRequest);
  };

  let Some(host_id_bytes) = verify_user(&prefix, &domain, &password).await? else {
    return Err(Error::Unauthorized);
  };

  let from: Address = if sender_name.is_empty() {
    email.as_str().into()
  } else {
    (sender_name.as_str(), email.as_str()).into()
  };

  let body = MessageBuilder::new()
    .from(from)
    .to(to.as_str())
    .subject(title)
    .text_body(txt)
    .html_body(html)
    .write_to_vec()?;

  let Some(mail) = Mail::new(&email, [&to], body) else {
    return Err(Error::BadRequest);
  };

  let sk: Option<Vec<u8>> = R.get(DKIM_SK).await.ok().flatten();
  let Some(sk_arr) = sk.and_then(|s| s.try_into().ok()) else {
    return Err(Error::NoDkimSk);
  };

  let _ = sign_and_send(&sk_arr, &host_id_bytes, mail).await;

  Ok(())
}
