use aok::{OK, Void};
use bytes::Bytes;
use log::info;
use reqer::{Client, Method, delete, get, head, patch, post, put};

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[tokio::test]
async fn test() -> Void {
  let client = Client::new();
  info!("client initialized");

  assert_eq!(Method::GET.as_str(), "GET");
  assert_eq!(format!("{}", Method::POST), "POST");
  assert_eq!(Method::PUT.as_str(), "PUT");
  assert_eq!(Method::DELETE.as_str(), "DELETE");
  assert_eq!(Method::PATCH.as_str(), "PATCH");
  assert_eq!(Method::HEAD.as_str(), "HEAD");

  let req = client
    .get("https://httpbin.org/get")
    .header("User-Agent", "reqer-test")
    .headers([("Accept", "application/json"), ("X-Custom", "value")]);

  let post_req = client
    .post("https://httpbin.org/post")
    .body(Bytes::from_static(b"{\"hello\":\"world\"}"));

  let req_custom = client.req(Method::PUT, "https://httpbin.org/put");

  let _ = (req, post_req, req_custom);

  let _g = get("https://httpbin.org/get");
  let _p = post("https://httpbin.org/post");
  let _u = put("https://httpbin.org/put");
  let _d = delete("https://httpbin.org/delete");
  let _pa = patch("https://httpbin.org/patch");
  let _h = head("https://httpbin.org/head");

  info!("builder ready");
  OK
}
