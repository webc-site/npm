import toPath from "./toPath.js";
import runUpsert from "./runUpsert.js";
import totals from "./totals.js";

export default (
  from,
  to_li,
  update_cache,
  tran,
  update,
  upsert,
  dir_li,
  onProgress,
  relations,
  log,
) => {
  const update_set = new Set(update),
    to_lang_set = new Set(to_li),
    total_tran = onProgress ? totals(update_set, to_lang_set, relations) : 0;

  let current_tran = 0;

  if (onProgress) {
    onProgress(0, total_tran);
  }

  const cacheUpdate = async (to_lang_li, prefix, rel) => {
    for (const to_lang of to_lang_li) {
      const to_path = toPath(prefix, rel, to_lang, dir_li);
      if (update_set.has(to_path)) {
        await runUpsert(update_cache, prefix, rel, from, to_lang, to_path, upsert, log);
      }
    }
  };

  return async ([prefix, rel, from_path, to_lang_li]) => {
    const from_updated = update_set.has(from_path);

    let tran_li = to_lang_set;
    if (!from_updated) {
      await cacheUpdate(to_lang_li, prefix, rel);
      tran_li = to_lang_set.difference(new Set(to_lang_li));
    }

    for (const to_lang of tran_li) {
      const to_path = toPath(prefix, rel, to_lang, dir_li);
      await runUpsert(tran, prefix, rel, from, to_lang, to_path, upsert, log);
      if (onProgress) {
        onProgress(++current_tran, total_tran);
      }
    }

    if (from_updated) {
      await upsert(from_path);
    }
  };
};
