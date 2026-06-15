import walk from "./walk.js";
import rm from "./rm.js";
import relParse from "./relParse.js";
import scan from "@1-/scan";
import dbOpen from "./dbOpen.js";
import md5Collect from "./md5Collect.js";

/*
扫描并解析项目中的国际化翻译文件

参数:
root: 项目根目录
db_dir: 数据库目录
from: 源语言类型
to_li: 目标语言类型列表
i18n_dir_name_li: 国际化目录名称列表
ext_li: 扫描的文件扩展名列表

返回值:
[
  relations: 语言关系映射
  update: 发生更新的源文件路径列表
  wrappedUpsert: 数据库事务提交函数
  traned_path_src_txt_md5: 目标译文路径至其源文件内容及MD5的映射
]
*/

export default async (root, db_dir, from, to_li, i18n_dir_name_li, ext_li) => {
  // 遍历目录获取翻译文件路径列表
  const res_li = await walk(root, from, to_li, i18n_dir_name_li, ext_li);
  // 清理无对应源文件的冗余译文文件
  await rm(res_li, root, to_li);
  // 解析并提取源文件列表及语言对应关系
  const [files, relations] = relParse(res_li, from, to_li),
    // 扫描比对数据库，确定待更新和待插入的源文件
    [update, upsert] = await scan(root, db_dir, files),
    // 初始化数据库连接，写入扫描元数据，加载已存在译文的MD5映射
    [wrappedUpsert, md5_map] = await dbOpen(root, db_dir, upsert, files),
    traned_path_src_txt_md5 = await md5Collect(
      root,
      from,
      to_li,
      relations,
      new Set(update),
      md5_map,
    );

  return [relations, update, wrappedUpsert, traned_path_src_txt_md5];
};
