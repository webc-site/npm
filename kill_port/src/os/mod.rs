#[cfg(unix)]
mod unix;
#[cfg(unix)]
pub(crate) use unix::kill_process;

#[cfg(windows)]
mod win;
#[cfg(windows)]
pub(crate) use win::kill_process;
