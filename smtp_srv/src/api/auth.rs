use axum::{
  extract::Request,
  http::{HeaderMap, StatusCode, header::AUTHORIZATION},
  middleware::Next,
  response::Response,
};
use base64::{Engine, engine::general_purpose::STANDARD};

genv::s!(SMTP_API_USER: String);
genv::s!(SMTP_API_PASSWORD: String);

pub async fn auth(headers: HeaderMap, req: Request, next: Next) -> Result<Response, StatusCode> {
  if let Some(auth_header) = headers.get(AUTHORIZATION) {
    if let Ok(auth_str) = auth_header.to_str() {
      if let Some(strip) = auth_str.strip_prefix("Basic ") {
        if let Ok(decoded) = STANDARD.decode(strip.trim()) {
          if let Ok(credentials) = String::from_utf8(decoded) {
            if let Some((user, pass)) = credentials.split_once(':') {
              if user == *SMTP_API_USER && pass == *SMTP_API_PASSWORD {
                return Ok(next.run(req).await);
              }
            }
          }
        }
      }
    }
  }
  Err(StatusCode::UNAUTHORIZED)
}
