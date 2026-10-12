import int from "@3-/int";

/*
ip_str IP字符串
返回值 32位无符号整数
*/
export default (ip_str) => {
  const [a, b, c, d] = ip_str.split(".").map(int);
  return ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;
};
