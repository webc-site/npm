/*
ver: 版本号字符串
返回: 末位递增后的版本号
*/
export default (ver) => {
  const pos = ver.lastIndexOf(".");
  return pos < 0 ? +ver + 1 + "" : ver.slice(0, pos + 1) + (+ver.slice(pos + 1) + 1);
};
