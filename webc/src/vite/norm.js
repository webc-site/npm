import { isAbsolute, join } from "node:path";

export default (path, root) => {
  if (root && isAbsolute(path) && !path.startsWith(root)) {
    return join(root, path);
  }
  return path;
};
