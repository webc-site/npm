import read from "@3-/read";
import npmver from "@1-/npmver";

export default async (pkg_path) => {
  const pkg = JSON.parse(read(pkg_path)),
    { name, version } = pkg;
  let online;
  try {
    online = await npmver(name);
  } catch {}
  return [name, version, online === version];
};
