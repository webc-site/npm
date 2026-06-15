use genv::s;

s!(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
s!(DB_PORT: u16 | 3306);

xboot::init!(DB: mysql_async::Pool {
  Result::<mysql_async::Pool, mysql_async::Error>::Ok(crate::pool(
    &*DB_HOST,
    *DB_PORT,
    Some(&*DB_USER),
    Some(&*DB_PASSWORD),
    Some(&*DB_NAME),
  ))
}, 0);
