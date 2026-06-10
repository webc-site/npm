import read from "@1-/read";

import mdValidate from "./mdValidate.js";

export default async (path) => mdValidate(await read(path));
