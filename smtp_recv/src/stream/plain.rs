use tokio::{
  io::{BufReader, ReadHalf, WriteHalf},
  net::TcpStream,
};

/// 明文TCP流
pub struct PlainStream {
  pub reader: BufReader<ReadHalf<TcpStream>>,
  pub writer: WriteHalf<TcpStream>,
}
