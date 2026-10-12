use std::future::Future;

use tokio::{
  io::{AsyncBufReadExt, AsyncWriteExt, BufReader, split},
  net::TcpStream,
};
use tokio_rustls::server::TlsStream as ServerTlsStream;

use crate::Result;

mod plain;
mod tls;

pub use plain::PlainStream;
pub use tls::{TlsStream, perform_tls_handshake};

pub trait Stream {
  fn send(&mut self, msg: &str) -> impl Future<Output = Result<()>>;
  fn read_line(&mut self, buf: &mut String) -> impl Future<Output = Result<usize>>;
  fn buf_line(&mut self) -> bool;
  fn flush(&mut self, responses: &[String]) -> impl Future<Output = Result<()>>;
}

impl Stream for PlainStream {
  async fn send(&mut self, msg: &str) -> Result<()> {
    self.writer.write_all(msg.as_bytes()).await?;
    self.writer.write_all(b"\r\n").await?;
    Ok(())
  }

  async fn read_line(&mut self, buf: &mut String) -> Result<usize> {
    Ok(self.reader.read_line(buf).await?)
  }

  fn buf_line(&mut self) -> bool {
    self.reader.buffer().contains(&b'\n')
  }

  async fn flush(&mut self, responses: &[String]) -> Result<()> {
    flush(&mut self.writer, responses).await
  }
}

impl Stream for TlsStream {
  async fn send(&mut self, msg: &str) -> Result<()> {
    self.writer.write_all(msg.as_bytes()).await?;
    self.writer.write_all(b"\r\n").await?;
    Ok(())
  }

  async fn read_line(&mut self, buf: &mut String) -> Result<usize> {
    Ok(self.reader.read_line(buf).await?)
  }

  fn buf_line(&mut self) -> bool {
    self.reader.buffer().contains(&b'\n')
  }

  async fn flush(&mut self, responses: &[String]) -> Result<()> {
    flush(&mut self.writer, responses).await
  }
}

pub enum StreamEnum {
  None,
  Plain(PlainStream),
  Tls(TlsStream),
}

use crate::SmtpError;

/// 用于简化 StreamEnum 的 Stream trait 实现
macro_rules! dispatch {
  ($self:expr, $method:ident $(, $arg:expr)*) => {
    match $self {
      StreamEnum::None => {
        log::error!("StreamEnum::None should never be used");
        Err(SmtpError::StreamNone)
      }
      StreamEnum::Plain(s) => s.$method($($arg),*).await,
      StreamEnum::Tls(s) => s.$method($($arg),*).await,
    }
  };
}

impl Stream for StreamEnum {
  async fn send(&mut self, msg: &str) -> Result<()> {
    dispatch!(self, send, msg)
  }

  async fn read_line(&mut self, buf: &mut String) -> Result<usize> {
    dispatch!(self, read_line, buf)
  }

  fn buf_line(&mut self) -> bool {
    match self {
      StreamEnum::None => {
        log::error!("StreamEnum::None should never be used");
        false
      }
      StreamEnum::Plain(s) => s.buf_line(),
      StreamEnum::Tls(s) => s.buf_line(),
    }
  }

  async fn flush(&mut self, responses: &[String]) -> Result<()> {
    dispatch!(self, flush, responses)
  }
}

impl StreamEnum {
  /// 创建新的明文流
  #[cfg(feature = "forward")]
  pub fn new_plain(stream: TcpStream) -> Self {
    let (reader, writer) = split(stream);
    Self::Plain(PlainStream {
      reader: BufReader::new(reader),
      writer,
    })
  }

  #[cfg(feature = "forward")]
  pub fn is_tls(&self) -> bool {
    matches!(self, StreamEnum::Tls(_))
  }

  /// 创建新的TLS流
  pub fn new_tls(stream: ServerTlsStream<TcpStream>) -> Self {
    let (reader, writer) = split(stream);
    Self::Tls(TlsStream {
      reader: BufReader::new(reader),
      writer,
    })
  }
}

/// 批量发送响应
pub async fn flush<W: AsyncWriteExt + Unpin + ?Sized>(
  writer: &mut W,
  responses: &[String],
) -> Result<()> {
  for response in responses {
    writer.write_all(response.as_bytes()).await?;
    writer.write_all(b"\r\n").await?;
  }
  Ok(())
}
