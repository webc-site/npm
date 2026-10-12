use std::env;

use aok::{OK, Void};
use log::info;
use serde::{Deserialize, Serialize};
use sonic_rs::from_str;
use sur::{Conf, RecordId, surreal};

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct TestRow {
  id: RecordId,
  name: String,
  val: u64,
}

#[tokio::test]
async fn test() -> Void {
  let conf_str = env::var("SDB").unwrap_or_else(|_| {
    r#"{"uri":"http://127.0.0.1:9050","username":"i","password":"TzJGXFIMQlUj4eBX","namespace":"dev"}"#.to_string()
  });

  let conf: Conf = from_str(&conf_str)?;
  info!("conf: {conf:?}");

  let sur = surreal(&conf);

  let db = sur.db("i");

  // 写入测试数据
  let test_id = "test:101";
  let rec_id: RecordId = test_id.parse()?;
  info!("rec_id: {rec_id}");

  let sql = "UPSERT test:101 SET name = $name, val = $val;";
  let res: Vec<Vec<TestRow>> = db
    .q(
      sql,
      &sonic_rs::json!({
        "name": "sur_test",
        "val": 123456
      }),
    )
    .await?;

  info!("upsert res: {res:?}");
  assert_eq!(res.len(), 1);
  assert_eq!(res[0].len(), 1);
  assert_eq!(res[0][0].name, "sur_test");
  assert_eq!(res[0][0].val, 123456);
  assert_eq!(res[0][0].id.tb, "test");
  assert_eq!(res[0][0].id.id, "101");

  // 查询测试数据
  let query_sql = "SELECT * FROM test:101;";
  let rows: Vec<Vec<TestRow>> = db.q(query_sql, &sonic_rs::json!({})).await?;
  info!("query rows: {rows:?}");
  assert_eq!(rows.len(), 1);
  assert_eq!(rows[0][0].name, "sur_test");

  // 单结果查询测试
  let single: Option<Vec<TestRow>> = db.q1(query_sql, &sonic_rs::json!({})).await?;
  info!("single result: {single:?}");
  assert!(single.is_some());

  // RecordId 单元测试
  let rec_from_tuple: RecordId = ("user", "102").into();
  assert_eq!(rec_from_tuple.to_string(), "user:102");
  assert_eq!(rec_from_tuple.tb, "user");
  assert_eq!(rec_from_tuple.id, "102");

  let parsed: RecordId = "account:admin".parse()?;
  assert_eq!(parsed.tb, "account");
  assert_eq!(parsed.id, "admin");

  assert!("invalid_id_without_colon".parse::<RecordId>().is_err());

  // Conf 别名与反序列化测试
  let alias_conf: Conf =
    from_str(r#"{"url":"http://127.0.0.1:9050","user":"u","pass":"p","ns":"n"}"#)?;
  assert_eq!(alias_conf.uri, "http://127.0.0.1:9050");
  assert_eq!(alias_conf.username, "u");
  assert_eq!(alias_conf.password, "p");
  assert_eq!(alias_conf.namespace, Some("n".to_string()));

  let no_ns_conf: Conf =
    from_str(r#"{"uri":"http://127.0.0.1:9050","username":"root","password":"123"}"#)?;
  assert_eq!(no_ns_conf.namespace, None);

  OK
}
