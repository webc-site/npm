import find from "@1-/find";

export default (dir) => find(dir, ".git") ?? dir;
