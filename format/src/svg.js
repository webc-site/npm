import ERR from "@3-/log/ERR.js";
import minify from "@3-/svgo";

export default (txt) => {
  try {
    return minify(txt);
  } catch (e) {
    ERR(e);
    return txt;
  }
};
