import ext from "@3-/ext";
import mime from "./mime.js";

export default (file_name) => mime(ext(file_name));
