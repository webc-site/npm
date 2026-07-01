use crate::Cipher;

impl Cipher {
  pub fn encrypt(&self, nonce: impl AsRef<[u8]>, plaintext: impl AsRef<[u8]>) -> Vec<u8> {
    let mut data = plaintext.as_ref().to_vec();
    self.encrypt_in_place(nonce, &mut data);
    data
  }

  pub fn encrypt_in_place(&self, nonce: impl AsRef<[u8]>, data: &mut [u8]) {
    self.xor_in_place(nonce, data);
  }
}
