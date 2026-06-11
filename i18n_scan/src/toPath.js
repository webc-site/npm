import { sep } from "node:path";

export default (prefix, rel, to_lang) => prefix + sep + to_lang + sep + rel;
