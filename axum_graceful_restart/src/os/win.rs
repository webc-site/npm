use std::{
  net::{SocketAddr, TcpListener as StdTcpListener},
  process::id as process_id,
  time::Duration,
};

use axum::Router;
use socket2::{Domain, Socket, Type};
use tokio::{net::TcpListener, time::sleep};
use tracing::{error, info};

use crate::Result;

const RESTART_DELAY: Duration = Duration::from_millis(500);

fn listen(addr: SocketAddr) -> Result<TcpListener> {
  let socket = Socket::new(Domain::for_address(addr), Type::STREAM, None)?;
  socket.set_reuse_address(true)?;
  socket.bind(&addr.into())?;
  socket.listen(128)?;
  let std_listener: StdTcpListener = socket.into();
  std_listener.set_nonblocking(true)?;
  let tokio_listener = TcpListener::from_std(std_listener)?;
  Ok(tokio_listener)
}

async fn wait_for_shutdown() -> Result<()> {
  tokio::signal::ctrl_c().await?;
  let pid = process_id();
  info!("{pid} | Ctrl+C recv");
  Ok(())
}

fn term_old_processes(port: u16) {
  if port == 0 {
    return;
  }
  let my_pid = process_id();
  match listeners::get_all() {
    Err(err) => {
      error!("get_all listeners for port {port} failed: {err}");
    }
    Ok(all_listeners) => {
      let mut unique_pids = Vec::with_capacity(4);
      for listener in all_listeners {
        if listener.socket.port() == port {
          let pid = listener.process.pid;
          if pid != my_pid && !unique_pids.contains(&pid) {
            unique_pids.push(pid);
            let name = &listener.process.name;
            info!("{my_pid} | send terminate signal to old process {name} pid={pid}");
            #[cfg(windows)]
            {
              use kill_tree::blocking::kill_tree;
              if let Err(err) = kill_tree(pid) {
                error!("failed to kill process tree {pid}: {err}");
              }
            }
          }
        }
      }
    }
  }
}

pub struct GracefulRestart {
  listener: TcpListener,
  addr: SocketAddr,
}

impl GracefulRestart {
  pub fn new(addr: SocketAddr) -> Result<Self> {
    let listener = listen(addr)?;
    Ok(Self { listener, addr })
  }

  pub async fn serve(self, app: Router) -> Result<()> {
    let (shutdown_trigger_tx, shutdown_trigger_rx) = tokio::sync::oneshot::channel::<()>();

    let shutdown = async {
      if let Err(err) = wait_for_shutdown().await {
        error!("wait_for_shutdown failed: {err}");
      }
      let _ = shutdown_trigger_tx.send(());
    };

    let app = app.into_make_service();

    let pid = process_id();
    let port = self.addr.port();
    tokio::spawn(async move {
      sleep(RESTART_DELAY).await;
      let _ = tokio::task::spawn_blocking(move || {
        term_old_processes(port);
      })
      .await;
    });

    info!("{pid} | listen {}", self.addr);

    let serve_fut = axum::serve(self.listener, app).with_graceful_shutdown(shutdown);

    let shutdown_timeout = async {
      let _ = shutdown_trigger_rx.await;
      tokio::select! {
        _ = sleep(crate::os::consts::SHUTDOWN_TIMEOUT) => {
          info!("graceful shutdown timeout ({:?}), forcing exit", crate::os::consts::SHUTDOWN_TIMEOUT);
        }
        _ = wait_for_shutdown() => {
          info!("force shutdown signal received during graceful shutdown");
        }
      }
    };

    tokio::select! {
      res = serve_fut => {
        res?;
      }
      _ = shutdown_timeout => {}
    }

    info!("{pid} | shutdown");
    Ok(())
  }
}

pub async fn serve(addr: SocketAddr, app: Router) -> Result<()> {
  GracefulRestart::new(addr)?.serve(app).await
}
