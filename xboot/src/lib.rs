use std::{fmt::Display, process, result::Result as StdResult};

use aok::Result;
pub use async_wrap::{OnceCell, Wrap};
pub use gensym::gensym;
pub use linkme::distributed_slice;
pub use log;
pub use paste::paste;
pub use tokio;
use tokio::task::JoinHandle;

pub type Task = JoinHandle<Result<()>>;

pub type AsyncFn = fn() -> Task;

/// 引导任务结构体，包含优先级和对应的初始化函数。
pub struct BootTask {
  /// 任务优先级，数值越小越先执行。
  pub priority: i32,
  /// 异步初始化函数的指针。
  pub run: AsyncFn,
}

#[distributed_slice]
pub static ASYNC: [BootTask];

/// 并发/顺序初始化所有已注册的异步任务。
///
/// 相同优先级的任务会并发执行，不同优先级的任务会按优先级从小到大顺序执行。
pub async fn init() -> Result<()> {
  if ASYNC.is_empty() {
    return Ok(());
  }

  // 收集任务指针到本地 Vec
  let mut tasks: Vec<&BootTask> = ASYNC.iter().collect();

  // 按优先级升序排序
  tasks.sort_by_key(|t| t.priority);

  // 分组并发执行
  let mut i = 0;
  while i < tasks.len() {
    let priority = tasks[i].priority;
    let mut j = i + 1;
    while j < tasks.len() && tasks[j].priority == priority {
      j += 1;
    }

    // 运行当前优先级分组内的所有任务
    let mut handles = Vec::with_capacity(j - i);
    for task in &tasks[i..j] {
      handles.push((task.run)());
    }
    for handle in handles {
      handle.await??;
    }

    i = j;
  }

  Ok(())
}

/// 辅助函数：若初始化返回错误，记录日志并退出程序。
#[doc(hidden)]
pub fn exit_on_err<T, E: Display>(name: &str, res: StdResult<T, E>) -> T {
  match res {
    Ok(r) => r,
    Err(err) => {
      log::error!("{name} : {err}");
      process::exit(1);
    }
  }
}

#[macro_export]
macro_rules! _add {
  ($id:expr, $priority:expr, $init:expr) => {
    $crate::paste! {
    fn [<xboot_init_ $id>]() -> $crate::Task {
      $crate::tokio::task::spawn(async {
        $init;
        Ok(())
      })
    }
    #[$crate::distributed_slice($crate::ASYNC)]
    static [<ASYNC_INIT_ $id>]: $crate::BootTask = $crate::BootTask {
      priority: $priority,
      run: [<xboot_init_ $id>],
    };
    }
  };
}

#[macro_export]
macro_rules! add {
  ($init:expr) => {
    $crate::gensym! {$crate::_add! {0, $init}}
  };
  ($init:expr, $priority:expr) => {
    $crate::gensym! {$crate::_add! {$priority, $init}}
  };
}

#[macro_export]
macro_rules! init {
  ($var:ident: $type:ty $init:block) => {
    $crate::init!($var: $type $init, 0);
  };
  ($var:ident: $type:ty $init:block, $priority:expr) => {
    $crate::paste! {
    static [< _CELL_ $var >]: $crate::OnceCell<$type> = $crate::OnceCell::const_new();
    pub static $var: $crate::Wrap<$type> = $crate::Wrap(& [< _CELL_ $var >]);
    $crate::add!(
      {
        [< _CELL_ $var >].get_or_init(|| async {
          $crate::exit_on_err(stringify!($var), async $init.await)
        })
      }
      .await,
      $priority
    );
    }
  };
}
