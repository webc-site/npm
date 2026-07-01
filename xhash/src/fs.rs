use std::{
  fs::File,
  io::{self, Read},
  path::Path,
};

use crate::hasher::Hasher;

#[derive(Debug, Clone)]
pub struct HashLen {
  pub hash: Vec<u8>,
  pub len: usize,
}

pub const BUFFER_SIZE: usize = 16384;

pub fn hash_len(path: impl AsRef<Path>) -> Result<HashLen, io::Error> {
  let mut reader = File::open(path)?;
  let mut hasher = Hasher::new();
  let mut buf = [0; BUFFER_SIZE];

  loop {
    let n = reader.read(&mut buf)?;
    if n == 0 {
      break;
    }
    hasher.write(&buf[..n]);
  }

  let total_len = hasher.len;
  Ok(HashLen {
    hash: hasher.finish(),
    len: total_len,
  })
}
