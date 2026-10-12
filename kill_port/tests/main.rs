use std::{
  env,
  net::TcpListener,
  process::{Command, Stdio},
  thread,
  time::Duration,
};

use aok::{OK, Void};

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test() -> Void {
  if env::var("RUN_TEST_SERVER").is_ok() {
    let port_str = env::var("TEST_PORT").unwrap();
    let listener = TcpListener::bind(format!("127.0.0.1:{port_str}")).unwrap();
    for _stream in listener.incoming() {}
    return OK;
  }

  let port = {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    listener.local_addr().unwrap().port()
  };

  let mut child = Command::new(env::current_exe().unwrap())
    .env("RUN_TEST_SERVER", "1")
    .env("TEST_PORT", port.to_string())
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .spawn()
    .unwrap();

  thread::sleep(Duration::from_millis(500));

  kill_port::kill_port(port).unwrap();

  let _status = child.wait().unwrap();

  OK
}
