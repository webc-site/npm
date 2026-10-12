import { homedir } from "node:os";
import { join } from "node:path";

export default (name) => join(homedir(), ".cache", name);
