use aok::Result;

#[derive(Clone)]
pub struct Cert;

impl ssl_trait::CertByHost for Cert {
  type Item = cert_by_host::Cert;
  async fn get(&self, host: &str) -> Result<Option<Self::Item>> {
    let target_host = if host.bytes().filter(|&b| b == b'.').count() > 1 {
      host
        .split_once('.')
        .map(|(_, suffix)| suffix)
        .unwrap_or(host)
    } else {
      host
    };
    cert_by_host::CertByHost.get(target_host).await
  }
}
