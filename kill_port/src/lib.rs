#![cfg_attr(docsrs, feature(doc_cfg))]

pub(crate) mod os;

use std::{io, process, thread, time::Duration};

use log::{error, info};

/// 终止占用指定端口的进程
pub fn kill_port(port: u16) -> io::Result<()> {
  if port == 0 {
    return Ok(());
  }
  let my_pid = process::id();
  let mut retry = 0;
  loop {
    let all_listeners = listeners::get_all().map_err(|err| io::Error::other(err.to_string()))?;
    let mut to_kill = 0;
    retry += 1;

    let mut unique_pids = Vec::new();

    for listener in all_listeners {
      let socket_port = listener.socket.port();
      let process = listener.process;
      let pid = process.pid;

      if socket_port == port && pid != my_pid && !unique_pids.contains(&pid) {
        unique_pids.push(pid);
        to_kill += 1;
        let name = &process.name;
        info!("{my_pid} | {retry} | kill_port {port} → {name} pid={pid}");

        // 终止进程
        if let Err(err) = os::kill_process(pid, retry) {
          error!("{err}");
        }
      }
    }
    if to_kill == 0 {
      break;
    }
    let sleep_ms = if retry == 1 { 500 } else { 1000 };
    thread::sleep(Duration::from_millis(sleep_ms));
  }
  Ok(())
}
