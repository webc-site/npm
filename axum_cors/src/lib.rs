use axum::{
  body::Body,
  extract::Request,
  http::{HeaderValue, Method, header},
  middleware::Next,
  response::IntoResponse,
};

pub async fn cors(req: Request<Body>, next: Next) -> impl IntoResponse {
  let origin = req.headers().get(header::ORIGIN).cloned();
  let req_headers = req
    .headers()
    .get(header::ACCESS_CONTROL_REQUEST_HEADERS)
    .cloned();

  let is_options = req.method() == Method::OPTIONS;
  let mut res = if is_options {
    let mut res = "".into_response();
    res.headers_mut().insert(
      header::ACCESS_CONTROL_MAX_AGE,
      HeaderValue::from_static("9999999"),
    );
    res
  } else {
    next.run(req).await
  };

  let headers = res.headers_mut();

  if let Some(origin) = origin {
    headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, origin);
  }

  if let Some(req_headers) = req_headers {
    headers.insert(header::ACCESS_CONTROL_ALLOW_HEADERS, req_headers);
  }

  headers.insert(
    header::ACCESS_CONTROL_ALLOW_CREDENTIALS,
    HeaderValue::from_static("true"),
  );

  headers.insert(
    header::ACCESS_CONTROL_ALLOW_METHODS,
    HeaderValue::from_static("*"),
  );

  res
}
