import { sep } from "node:path";

export default (prefix, rel, lang) => prefix + sep + lang + sep + rel;
