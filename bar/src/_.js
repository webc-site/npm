/*
命令行任务进度及状态显示器
返回值: [start, stop, incr, log]
  start: (total) => void 开始进度条，设置总任务数
  stop: () => void 停止进度条
  incr: () => void 增加已完成任务数
  log: (...args) => void 安全输出日志，不破坏进度条
    log.start: (task) => void 开始子任务
    log.end: (task) => void 结束子任务
*/

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  { stdout } = process,
  IS_TTY = stdout.isTTY,
  clear = IS_TTY
    ? (n) => {
        if (n > 0) {
          stdout.write("\r\x1b[" + n + "A\x1b[J");
        }
        return 0;
      }
    : () => 0;

export default () => {
  const running = new Set();
  let done = 0,
    total = 0,
    last_n = 0,
    start_at = 0,
    spin_idx = 0,
    timer = null;

  const format = (secs) => {
      if (secs < 0 || !isFinite(secs)) {
        return;
      }
      const m = Math.floor(secs / 60),
        s = secs % 60;
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    },
    render = () => {
      if (!IS_TTY) {
        return;
      }
      last_n = clear(last_n);
      const lines = [];
      if (total > 0) {
        const pct = Math.round((done / total) * 100);
        let eta;
        if (done > 0) {
          const elapsed = Date.now() - start_at,
            avg = elapsed / done;
          eta = format(Math.round(((total - done) * avg) / 1000));
        }
        lines.push(done + "/" + total + " (" + pct + "%) " + (eta ? "ETA " + eta : ""));
      }
      for (const task of running) {
        lines.push(SPINNER[spin_idx] + " " + task);
      }
      if (lines.length > 0) {
        lines.unshift("");
        stdout.write("\r" + lines.join("\n") + "\n");
        last_n = lines.length;
      } else {
        last_n = 0;
      }
    },
    log = (...args) => {
      last_n = clear(last_n);
      console.log(...args);
      render();
    },
    start = (val) => {
      total = val;
      done = 0;
      start_at = Date.now();
      if (IS_TTY) {
        timer = setInterval(() => {
          spin_idx = (spin_idx + 1) % SPINNER.length;
          render();
        }, 80);
      }
      render();
    },
    stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      last_n = clear(last_n);
      if (!IS_TTY && total > 0) {
        console.log(done + "/" + total);
      }
    },
    incr = () => {
      ++done;
      render();
    };

  log.start = (task) => {
    running.add(task);
    render();
  };

  log.end = (task) => {
    running.delete(task);
    render();
  };

  return [start, stop, incr, log];
};
