export default (pkg, root_nested) =>
  ({ resolvedValue }) => {
    if (!resolvedValue.startsWith(pkg)) {
      return;
    }

    resolvedValue = resolvedValue.slice(pkg.length).split(".");

    const resolved_val_len = resolvedValue.length;

    if (!resolved_val_len) {
      return;
    }

    let n = 0,
      type = root_nested;

    while (n < resolved_val_len) {
      type = type.nested[resolvedValue[n]];
      if (!type) return;
      ++n;
    }
    return [resolvedValue, type];
  };
