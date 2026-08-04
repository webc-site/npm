#![cfg(all(feature = "fs", feature = "hasher", feature = "xhash"))]

use std::path::PathBuf;

use xhash::{Hasher, fs::hash_len, xhash};

#[test]
fn test() -> aok::Result<()> {
  let dir: PathBuf = env!("CARGO_MANIFEST_DIR").into();
  let fp = dir.join("src/lib.rs");
  let bin = ifs::r(&fp)?;
  let hash_xhash = xhash(&bin);
  // let mut hasher = gxhash::GxHasher::with_seed(0);
  // hasher.write(&bin);
  // dbg!(hasher.finish_u128());

  //
  let hash_len = hash_len(&fp)?;

  assert_eq!(hash_xhash, hash_len.hash);

  let mut hasher = Hasher::new();
  hasher.write(&bin);
  assert_eq!(hash_xhash, hasher.finish());
  // dbg!(&bin.len());
  // let hash = xhash(&bin);

  // dbg!(&hash);
  // let hash: Vec<u8> = xhash!(hasher.finish_u128(), bin.len());
  // dbg!(&hash);
  //

  Ok(())
  // let mut bin = 0u128.to_le_bytes();
  // for i in 1..10000 {
  //   let r = hash128(&bin);
  //   bin = r.to_le_bytes();
  // }
}

/*
#[cfg(feature = "macro")]
mod test_macro {
}
*/
