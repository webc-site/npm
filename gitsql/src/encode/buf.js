import { encode } from "./base64.js";

export default (val) => "'" + encode(val) + "'";
