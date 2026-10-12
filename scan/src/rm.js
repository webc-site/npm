/*
批量删除记录
db: BinMap 实例
rm: 待删除的路径 path 数组
*/
export default (db, rm) => {
  rm.forEach((path) => db.delete(path));
};
