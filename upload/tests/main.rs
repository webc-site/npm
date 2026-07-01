use std::{env, time::Duration};

use aok::{OK, Void};
use log::info;
use tokio::time::sleep;
use upload::S3;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

fn get_env(key: &str) -> String {
  env::var(key).unwrap_or_else(|_| panic!("Missing env var {key}"))
}

#[tokio::test]
async fn test_upload() -> Void {
  dotenvy::from_filename("s3.env").expect("Failed to load s3.env");

  let s3_id = get_env("S3_ID");
  let s3_sk = get_env("S3_SK");
  let s3_region = get_env("S3_REGION");
  let s3_host = get_env("S3_ENDPOINT");
  let s3_bucket = get_env("S3_BUCKET");
  let s3_url = get_env("S3_URL");

  let s3_cdn = if s3_url.starts_with("http://") || s3_url.starts_with("https://") {
    s3_url.clone()
  } else {
    format!("https://{s3_url}")
  };

  let uploader = S3::new(s3_id, s3_sk, s3_host, s3_bucket, s3_region, []);

  let now_millis = jiff::Timestamp::now().as_millisecond();
  let data = format!("test-s3-rust-{now_millis}");
  let file_name = "test.txt";

  info!("Uploading data to Backblaze: {data}");

  let xhash_val = uploader.upload_xhash(file_name, data.clone()).await?;
  info!("Uploaded xhash_val: {xhash_val}");

  // 校验上传内容
  let url = if s3_cdn.ends_with('/') {
    format!("{s3_cdn}{xhash_val}")
  } else {
    format!("{s3_cdn}/{xhash_val}")
  };
  info!("Fetching url: {url}");

  let client = reqwest::Client::new();

  let mut text = String::new();
  let mut success = false;
  let url_prefix = &uploader.url_prefix;
  let fallback_url = format!("{url_prefix}{xhash_val}");

  for i in 0..10 {
    if i > 0 {
      sleep(Duration::from_secs(2)).await;
    }

    // 1. 尝试从 CDN url 获取
    if let Ok(resp) = client.get(&url).send().await
      && resp.status().as_u16() == 200
      && let Ok(t) = resp.text().await
      && t == data
    {
      text = t;
      success = true;
      break;
    }

    // 2. 降级尝试直接从 B2 endpoint 获取
    if let Ok(resp) = client.get(&fallback_url).send().await {
      if resp.status().as_u16() == 200 {
        if let Ok(t) = resp.text().await {
          if t == data {
            text = t;
            success = true;
            break;
          } else {
            info!("Fallback URL content mismatch (len: {})", t.len());
          }
        }
      } else {
        info!("Fallback URL returned status: {}", resp.status());
      }
    }
  }

  assert!(
    success,
    "Failed to verify upload content from both CDN and direct endpoint"
  );
  assert_eq!(text, data);

  info!("Upload verify success!");

  info!("Cleaning up: deleting {xhash_val}");
  uploader.delete(&xhash_val).await?;
  info!("Clean up success!");

  OK
}
