import bufmd5 from "./bufmd5.js";
import utf8e from "@3-/utf8/utf8e.js";

export default (str) => bufmd5(utf8e(str));
