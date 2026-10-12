use std::io;

use kill_tree::blocking::kill_tree;

pub(crate) fn kill_process(pid: u32, _retry: u32) -> io::Result<()> {
  kill_tree(pid)
    .map_err(|err| io::Error::other(format!("Failed to kill process tree {pid}: {err}")))
}
