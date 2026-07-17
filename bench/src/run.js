export default async (pkg, run, dataPath, options = {}) => {
  const { run: mitataRun, bench, group } = await import("mitata");
  for (const [name, data] of (await import(dataPath)).default) {
    group(name, () => {
      bench(pkg, run(data));
    });
  }
  const { quiet, formatTable } = options;
  if (quiet) {
    const res = await mitataRun({ format: "quiet" });
    if (formatTable) {
      console.log("\n" + formatTable(res));
    }
  } else {
    await mitataRun();
  }
};
