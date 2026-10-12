import gitCmd from "./cmd.js";

const hasGithub = (url) => /\bgithub\.com\b/.test(url);

export default async (cwd) => {
  const git = gitCmd(cwd),
    remote_res = await git("remote -v"),
    line_li = remote_res.stdout.trim().split("\n").filter(Boolean),
    remote_map = {},
    target = new Set();

  for (const line of line_li) {
    const part_li = line.split(/\s+/);
    if (part_li.length >= 2) {
      remote_map[part_li[0]] = part_li[1];
    }
  }

  let gh_remote = "";
  for (const [name, url] of Object.entries(remote_map)) {
    if (hasGithub(url)) {
      gh_remote = name;
      break;
    }
  }

  if (remote_map.origin) {
    target.add("origin");
  } else {
    const first = Object.keys(remote_map)[0];
    if (first) {
      target.add(first);
    }
  }

  if (gh_remote) {
    target.add(gh_remote);
  }

  return [[...target], gh_remote || [...target][0] || "origin"];
};
