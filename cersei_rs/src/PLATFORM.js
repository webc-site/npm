import read from "@3-/read";

const PLATFORM = {
    win32: () => "win32-" + process.arch + "-msvc",
    linux: () =>
      "linux-" + process.arch + "-" + (read("/usr/bin/ldd").includes("musl") ? "musl" : "gnu"),
  },
  { platform } = process;

export default (() => (PLATFORM[platform] || (() => platform + "-" + process.arch))())();
