/*
预先计算所需执行的翻译总数
update_set: 待更新的文件路径集合 (Set)
to_lang_set: 目标语言集合 (Set)
relations: 文件关系数组
返回值: 翻译总数
*/
export default (update_set, to_lang_set, relations) => {
  const size = to_lang_set.size;
  let total_tran = 0;
  for (const [, , from_path, to_lang_li] of relations) {
    if (update_set.has(from_path)) {
      total_tran += size;
    } else {
      total_tran += size - to_lang_li.length;
    }
  }
  return total_tran;
};
