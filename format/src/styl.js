import parse from "@1-/stylus/parse.js";
import fmt from "@1-/stylus/fmt.js";
import ERR from "@3-/log/ERR.js";

export default (txt) => {
  try {
    return fmt(parse(txt));
  } catch (e) {
    ERR(e);
    return txt;
  }
};
