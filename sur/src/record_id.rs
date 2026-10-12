use std::{
  fmt::{self, Display, Formatter},
  str::FromStr,
};

use ciborium::Value;
use serde::{Deserialize, Deserializer, Serialize, Serializer, de};

#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct RecordId {
  pub tb: String,
  pub id: String,
}

#[inline]
fn val_to_str(v: Value) -> String {
  match v {
    Value::Text(s) => s,
    Value::Integer(i) => i128::from(i).to_string(),
    Value::Tag(_, inner) => val_to_str(*inner),
    Value::Bytes(b) => {
      String::from_utf8(b).unwrap_or_else(|e| String::from_utf8_lossy(&e.into_bytes()).into_owned())
    }
    Value::Bool(b) => b.to_string(),
    Value::Float(f) => f.to_string(),
    other => format!("{other:?}"),
  }
}

impl RecordId {
  #[inline]
  pub fn new(tb: impl Into<String>, id: impl Into<String>) -> Self {
    Self {
      tb: tb.into(),
      id: id.into(),
    }
  }

  pub(crate) fn from_ciborium_value(val: Value) -> Result<Self, String> {
    match val {
      Value::Tag(8, inner) => Self::from_ciborium_value(*inner),
      Value::Text(s) => {
        if let Some((tb, id)) = s.split_once(':') {
          Ok(Self {
            tb: tb.to_string(),
            id: id.to_string(),
          })
        } else {
          Err(format!("invalid record id: {s}"))
        }
      }
      Value::Array(mut arr) if arr.len() == 2 => {
        let id = val_to_str(arr.swap_remove(1));
        let tb = val_to_str(arr.swap_remove(0));
        Ok(Self { tb, id })
      }
      Value::Map(entries) => {
        let mut tb = None;
        let mut id = None;
        for (k, v) in entries {
          if let Value::Text(key) = k {
            match key.as_str() {
              "tb" => tb = Some(val_to_str(v)),
              "id" => id = Some(val_to_str(v)),
              _ => {}
            }
          }
        }
        if let (Some(tb), Some(id)) = (tb, id) {
          Ok(Self { tb, id })
        } else {
          Err("invalid record id map".to_string())
        }
      }
      other => Err(format!("unexpected cbor value for record id: {other:?}")),
    }
  }
}

impl<T: Into<String>, I: Into<String>> From<(T, I)> for RecordId {
  #[inline]
  fn from((tb, id): (T, I)) -> Self {
    Self::new(tb, id)
  }
}

impl Display for RecordId {
  #[inline]
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{}:{}", self.tb, self.id)
  }
}

impl FromStr for RecordId {
  type Err = crate::Error;

  #[inline]
  fn from_str(s: &str) -> Result<Self, Self::Err> {
    if let Some((tb, id)) = s.split_once(':') {
      Ok(Self {
        tb: tb.to_string(),
        id: id.to_string(),
      })
    } else {
      Err(crate::Error::RecordId(s.to_string()))
    }
  }
}

impl Serialize for RecordId {
  #[inline]
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.collect_str(self)
  }
}

impl<'de> Deserialize<'de> for RecordId {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let val = Value::deserialize(deserializer)?;
    Self::from_ciborium_value(val).map_err(de::Error::custom)
  }
}
