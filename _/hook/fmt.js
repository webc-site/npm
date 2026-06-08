#!/usr/bin/env bun
import ERR from "@3-/log/ERR.js";
import { green } from "@3-/log/GREEN.js";
import { exit, stdout } from "node:process";
import { $ } from "zx";
import ROOT from "../ROOT.js";

const bunx = (cmd) => $(["bun x --bun " + cmd]),
  run = async (promise) => {
    try {
      await promise;
    } catch (e) {
      exit(e.exitCode || 1);
    }
  },
  all = async (cmds) => {
    const results = await Promise.allSettled(cmds.map((cmd) => bunx(cmd).quiet().nothrow()));
    return results.map((res, i) => {
      const cmd = cmds[i];
      if (res.status === "fulfilled") {
        const { stdout: out, stderr: err, exitCode } = res.value;
        return [cmd, out, err, exitCode];
      }
      return [cmd, "", "", 1];
    });
  },
  log = (results) => {
    results.forEach(([cmd, out, err]) => {
      stdout.write(green("❯ " + cmd) + "\n");
      if (out) {
        stdout.write(out);
      }
      if (err) {
        ERR(err);
      }
    });
  },
  hasErr = (results) => results.some(([, , , code]) => code !== 0),
  main = async () => {
    $.cwd = ROOT;
    $.verbose = true;

    await run(bunx("lint-staged"));

    const results = await all(["oxlint", "knip"]);

    log(results);

    if (hasErr(results)) {
      exit(1);
    }

    await run($(["git add -u"]));
  };

if (import.meta.main) {
  await main();
}
