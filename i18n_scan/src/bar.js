import cliProgress from "cli-progress";

export default () => {
  const bar = new cliProgress.SingleBar(
      {
        format: "{bar} {percentage}% {eta_formatted} | {value}/{total}",
      },
      cliProgress.Presets.shades_classic,
    ),
    log = (msg) => {
      if (bar.isActive) {
        const { value, total, payload } = bar;
        bar.stop();
        console.log(msg);
        bar.start(total, value, payload);
      } else {
        console.log(msg);
      }
    },
    on_progress = (curr_tran, total_tran) => {
      if (total_tran > 0) {
        bar.update(curr_tran);
      }
    };

  return [bar, log, on_progress];
};
