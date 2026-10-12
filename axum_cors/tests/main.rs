use aok::{OK, Result};
use axum::{
  Router,
  body::Body,
  http::{Request, StatusCode, header},
  middleware,
  response::IntoResponse,
  routing::get,
};
use axum_cors::cors;
use static_init::constructor;
use tower::ServiceExt;

#[constructor(0)]
extern "C" fn init() {
  loginit::init()
}

async fn handler() -> impl IntoResponse {
  "hello"
}

#[tokio::test]
async fn test_cors() -> Result<()> {
  let app = Router::new()
    .route("/", get(handler).post(handler))
    .layer(middleware::from_fn(cors));

  // 1. 测试没有 Origin 头部的普通 GET 请求
  let req = Request::builder().uri("/").body(Body::empty())?;
  let res = app.clone().oneshot(req).await?;
  assert_eq!(res.status(), StatusCode::OK);
  assert!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
      .is_none()
  );
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_CREDENTIALS)
      .unwrap(),
    "true"
  );
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_METHODS)
      .unwrap(),
    "*"
  );

  // 2. 测试有 Origin 头部的普通 GET 请求
  let req = Request::builder()
    .uri("/")
    .header(header::ORIGIN, "https://example.com")
    .body(Body::empty())?;
  let res = app.clone().oneshot(req).await?;
  assert_eq!(res.status(), StatusCode::OK);
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
      .unwrap(),
    "https://example.com"
  );
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_CREDENTIALS)
      .unwrap(),
    "true"
  );

  // 3. 测试 OPTIONS 预检请求
  let req = Request::builder()
    .method("OPTIONS")
    .uri("/")
    .header(header::ORIGIN, "https://example.com")
    .header(
      header::ACCESS_CONTROL_REQUEST_HEADERS,
      "authorization, content-type",
    )
    .body(Body::empty())?;
  let res = app.oneshot(req).await?;
  assert_eq!(res.status(), StatusCode::OK);
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_ORIGIN)
      .unwrap(),
    "https://example.com"
  );
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_CREDENTIALS)
      .unwrap(),
    "true"
  );
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_METHODS)
      .unwrap(),
    "*"
  );
  assert_eq!(
    res.headers().get(header::ACCESS_CONTROL_MAX_AGE).unwrap(),
    "9999999"
  );
  assert_eq!(
    res
      .headers()
      .get(header::ACCESS_CONTROL_ALLOW_HEADERS)
      .unwrap(),
    "authorization, content-type"
  );

  OK
}
