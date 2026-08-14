#[cfg(unix)]
mod unix;
#[cfg(unix)]
pub(crate) use unix::handle_sighup;

#[cfg(not(unix))]
mod other;
#[cfg(not(unix))]
pub(crate) use other::handle_sighup;
