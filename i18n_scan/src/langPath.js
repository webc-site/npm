import { sep } from "node:path";

export default (prefix, rel, lang) => (prefix ? prefix + sep : "") + lang + sep + rel;
