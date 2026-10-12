pub mod consts;

#[cfg(unix)]
mod unix;
#[cfg(unix)]
pub use unix::{GracefulRestart, serve};

#[cfg(windows)]
mod win;
#[cfg(windows)]
pub use win::{GracefulRestart, serve};
