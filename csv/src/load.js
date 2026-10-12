import read from "@1-/read";

import loads from "./loads.js";

export default async (path) => loads(await read(path));
