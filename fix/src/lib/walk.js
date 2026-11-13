import isObj from "@3-/is_obj";

const walk = (node, cb) => {
  if (!isObj(node)) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, cb);
    return;
  }
  cb(node);
  for (const key in node) {
    if (Object.hasOwn(node, key)) walk(node[key], cb);
  }
};

export default walk;
