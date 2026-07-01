/*
补充文件默认后缀名

path: 文件路径

返回: 补充后的文件路径
*/
export const ext = (path) =>
    path.endsWith(".styl") || path.endsWith(".css") ? path : path + ".styl",
  /*
  判断路径是否为 URL

  path: 待检测路径

  返回: 布尔值
  */
  isUrl = (path) => path.startsWith("url(") || /^(https?:)?\/\//.test(path);
