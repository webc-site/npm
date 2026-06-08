import isObj from "@3-/is_obj";

const walk = (node, callback) => {
  if (!isObj(node)) {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walk(item, callback);
    }
    return;
  }
  callback(node);
  for (const key in node) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      walk(node[key], callback);
    }
  }
};

export default walk;
