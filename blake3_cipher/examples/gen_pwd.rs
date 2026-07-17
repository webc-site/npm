use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use fastrand::fill;

fn main() {
  let mut bytes = [0u8; 32];
  fill(&mut bytes);
  let pwd = URL_SAFE_NO_PAD.encode(bytes);
  println!("{pwd}");
}
