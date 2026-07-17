import Table from "cli-table3";

const parseSize = (name) => {
  const match = name.match(/\((\d+)(MB|B)\)/i);
  if (!match) return 1;
  const val = parseInt(match[1], 10),
    unit = match[2].toUpperCase(),
    bytes = unit === "MB" ? val * 1000000 : val;
  return name.includes("Decoding") ? (bytes / 5) * 4 : bytes;
};

/*
格式化 mitata json 输出为无边框吞吐率表格 (MB/s)
res: mitata 运行结果 json 对象
返回无边框表格文本
*/
export default (res) => {
  const table = new Table({
    head: ["Group", "Benchmark", "Avg (MB/s)", "Min (MB/s)", "Max (MB/s)"],
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: " "
    },
    style: {
      "padding-left": 0,
      "padding-right": 2,
      head: ["blue", "bold"]
    }
  });

  for (const b of res.benchmarks) {
    if (!b || !b.runs) continue;
    const group_name = res.layout[b.group]?.name || "Default",
      size = parseSize(group_name);
    for (const r of b.runs) {
      if (!r || !r.stats) continue;
      table.push([
        group_name,
        r.name || "default",
        ((size * 1000) / r.stats.avg).toFixed(2),
        ((size * 1000) / r.stats.max).toFixed(2), // 慢耗时对应小吞吐
        ((size * 1000) / r.stats.min).toFixed(2) // 快耗时对应大吞吐
      ]);
    }
  }

  return table.toString();
};
