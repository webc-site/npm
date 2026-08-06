use fred::interfaces::KeysInterface;
use mail_send::mail_builder::MessageBuilder;
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
  Json([email, password, to, title, txt, html]): Json<[String; 6]>,
) -> Result<()> {
  if password.is_empty() || email.is_empty() || to.is_empty() {
    return Err(Error::BadRequest);
  }

  let Some((prefix, domain)) = norm_user_host(&email) else {
    return Err(Error::BadRequest);
  };

  let Some(host_id_bytes) = verify_user(&prefix, &domain, &password).await? else {
    return Err(Error::Unauthorized);
  };

  let body = MessageBuilder::new()
    .from(email.as_str())
    .to(to.as_str())
    .subject(title)
    .text_body(txt)
    .html_body(html)
    .write_to_vec()
    .map_err(|_| Error::BadRequest)?;

  let mail = Mail::new(&email, [&to], body).ok_or(Error::BadRequest)?;

  let sk: Option<Vec<u8>> = R.get(DKIM_SK).await.ok().flatten();

  if let Some(sk) = sk
    && let Ok(sk_arr) = sk.try_into()
  {
    let _ = sign_and_send(&sk_arr, &host_id_bytes, mail).await;
  } else {
    let _ = smtp_send::send(&mail, None).await;
  }

  Ok(())
}
