import { createRequire } from "node:module";
import PLATFORM from "./PLATFORM.js";

const require = createRequire(import.meta.url),
  native = require("../npm/" + PLATFORM);

export default native;
