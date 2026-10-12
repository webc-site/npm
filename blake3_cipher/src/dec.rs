use crate::Cipher;

impl Cipher {
  pub fn decrypt(&self, nonce: impl AsRef<[u8]>, ciphertext: impl AsRef<[u8]>) -> Vec<u8> {
    let mut decrypted = ciphertext.as_ref().to_vec();
    self.decrypt_in_place(nonce, &mut decrypted);
    decrypted
  }

  pub fn decrypt_in_place(&self, nonce: impl AsRef<[u8]>, data: &mut [u8]) {
    self.xor_in_place(nonce, data);
  }
}
