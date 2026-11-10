import read from "@1-/read";

import mdCheck from "./mdCheck.js";

export default async (path) => mdCheck(await read(path));
