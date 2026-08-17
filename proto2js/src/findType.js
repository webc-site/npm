export default (pkg, root_nested) => (type_obj) => {
  const { resolvedValue } = type_obj;
  if (!resolvedValue || !resolvedValue.startsWith(pkg)) {
    return;
  }

  const val_li = resolvedValue.slice(pkg.length).split(".");
  if (!val_li.length) {
    return;
  }

  let type = root_nested;
  for (const name of val_li) {
    type = type.nested?.[name];
    if (!type) return;
  }
  return [val_li, type];
};
