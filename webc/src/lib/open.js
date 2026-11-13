import { stdout } from "node:process";
import open from "open";

export default async (url) => {
  if (stdout.isTTY) {
    try {
      await open(url);
    } catch {}
  }
};
