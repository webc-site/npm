#!/usr/bin/env -S bun test

import { test, expect, spyOn } from "bun:test";

const run = async (is_tty, fn) => {
  const old_tty = process.stdout.isTTY;
  process.stdout.isTTY = is_tty;

  const write_spy = spyOn(process.stdout, "write").mockImplementation(() => {}),
    log_spy = spyOn(console, "log").mockImplementation(() => {}),
    Log = (await import(`../src/_.js?tty=${is_tty}`)).default,
    funcs = Log();

  await fn(funcs, log_spy, write_spy);

  write_spy.mockRestore();
  log_spy.mockRestore();
  process.stdout.isTTY = old_tty;
};

test("非交互模式", () =>
  run(false, ([start, stop, incr], log_spy) => {
    start(10);
    incr();
    stop();
    expect(log_spy).toHaveBeenCalledWith("1/10");
  }));

test("交互模式", () =>
  run(true, ([start, stop, incr, log], log_spy, write_spy) => {
    start(10);
    expect(write_spy).toHaveBeenCalled();

    log("hello");
    expect(log_spy).toHaveBeenCalledWith("hello");

    incr();
    log.start("task1");
    log.end("task1");
    stop();
  }));
