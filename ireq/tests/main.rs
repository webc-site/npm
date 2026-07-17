#[cfg(feature = "retry")]
use std::time::Duration;
use std::{
  net::SocketAddr,
  sync::atomic::{AtomicUsize, Ordering},
};

use ireq::Error;
#[cfg(feature = "retry")]
use ireq::{REQ, retry};
use tokio::{
  io::{AsyncReadExt, AsyncWriteExt},
  net::TcpListener,
};

async fn spawn_mock_server() -> SocketAddr {
  let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
  let addr = listener.local_addr().unwrap();

  tokio::spawn(async move {
    loop {
      if let Ok((mut socket, _)) = listener.accept().await {
        tokio::spawn(async move {
          let mut buf = [0; 1024];
          if let Ok(n) = socket.read(&mut buf).await {
            let request_str = String::from_utf8_lossy(&buf[..n]);
            let first_line = request_str.lines().next().unwrap_or("");

            // Basic routing based on path / status
            if first_line.contains("/retry") {
              static RETRY_COUNT: AtomicUsize = AtomicUsize::new(0);
              let count = RETRY_COUNT.fetch_add(1, Ordering::Relaxed);
              if count < 2 {
                let response = "HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
                let _ = socket.write_all(response.as_bytes()).await;
              } else {
                let response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 7\r\nConnection: close\r\n\r\nsuccess";
                let _ = socket.write_all(response.as_bytes()).await;
              }
            } else if first_line.contains("/status/404") {
              let response =
                "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
              let _ = socket.write_all(response.as_bytes()).await;
            } else if first_line.contains("/bin") {
              let response_body = b"binary_data_123";
              let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                response_body.len()
              );
              let _ = socket.write_all(response.as_bytes()).await;
              let _ = socket.write_all(response_body).await;
            } else {
              let response_body = format!("Request line: {}", first_line);
              let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                response_body.len(),
                response_body
              );
              let _ = socket.write_all(response.as_bytes()).await;
            }
            let _ = socket.flush().await;
          }
        });
      }
    }
  });

  addr
}

#[tokio::test]
async fn test_get() {
  let addr = spawn_mock_server().await;
  let url = format!("http://{}/test", addr);
  let res = ireq::get(&url).await.unwrap();
  assert!(res.contains("GET /test HTTP/1.1"));
}

#[tokio::test]
async fn test_getbin() {
  let addr = spawn_mock_server().await;
  let url = format!("http://{}/bin", addr);
  let res = ireq::getbin(&url).await.unwrap();
  assert_eq!(res.as_ref(), b"binary_data_123");
}

#[tokio::test]
async fn test_methods() {
  let addr = spawn_mock_server().await;

  let url = format!("http://{}", addr);
  let res = ireq::post(&url, "post_body").await.unwrap();
  assert!(res.contains("POST / HTTP/1.1"));

  let res = ireq::put(&url, "put_body").await.unwrap();
  assert!(res.contains("PUT / HTTP/1.1"));

  let res = ireq::delete(&url, "").await.unwrap();
  assert!(res.contains("DELETE / HTTP/1.1"));

  let res = ireq::patch(&url, "patch_body").await.unwrap();
  assert!(res.contains("PATCH / HTTP/1.1"));
}

#[tokio::test]
async fn test_error_status() {
  let addr = spawn_mock_server().await;
  let url = format!("http://{}/status/404", addr);
  let res = ireq::get(&url).await;
  assert!(res.is_err());
  if let Err(Error::Status(response)) = res {
    assert_eq!(response.status(), reqwest::StatusCode::NOT_FOUND);
  } else {
    panic!("expected Error::Status");
  }
}

#[cfg(feature = "retry")]
#[tokio::test]
async fn test_retry() {
  let addr = spawn_mock_server().await;
  let url = format!("http://{}/retry", addr);
  let req = REQ.get(&url);
  let res = retry::req(req, 3, Duration::from_millis(5)).await.unwrap();
  assert_eq!(res.as_ref(), b"success");
}

#[cfg(feature = "retry")]
#[tokio::test]
async fn test_retry_methods() {
  let addr = spawn_mock_server().await;
  let url = format!("http://{}/retry", addr);
  let res = retry::Retry::new(3, Duration::from_millis(5))
    .bin(&url)
    .await
    .unwrap();
  assert_eq!(res.as_ref(), b"success");

  let res = retry::Retry::new(3, Duration::from_millis(5))
    .get(&url)
    .await
    .unwrap();
  assert_eq!(res, "success");

  let url = format!("http://{}", addr);
  let res = retry::Retry::new(1, Duration::from_millis(1))
    .post(&url, "post_body")
    .await
    .unwrap();
  assert!(res.contains("POST / HTTP/1.1"));
}
