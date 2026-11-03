use rustls::pki_types::{PrivateKeyDer, PrivatePkcs8KeyDer};

fn main() {
  let key: PrivateKeyDer<'static> = PrivateKeyDer::Pkcs8(PrivatePkcs8KeyDer::from(vec![]));
  let bytes: &[u8] = key.as_ref(); // Check if this compiles
}
