import { env } from "node:process";
import read from "@3-/read";

const PLATFORM = {
    win32: () => "win32-" + process.arch + "-msvc",
    linux: () =>
      "linux-" + process.arch + "-" + (read("/usr/bin/ldd").includes("musl") ? "musl" : "gnu"),
  },
  { platform } = process;

export default env.PLATFORM ||
  (() => (PLATFORM[platform] || (() => platform + "-" + process.arch))())();
