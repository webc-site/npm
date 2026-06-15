pub const ERR: u8 = 1;
pub const TOOL: u8 = 2;
pub const TXT: u8 = 3;
pub const THINK: u8 = 4;

pub enum Msg {
  Txt(String),
  Tool(String, Option<String>),
  Err(String),
  Think(String),
}
