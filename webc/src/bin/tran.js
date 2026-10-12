#!/usr/bin/env node
import tran from "@1-/tran";
import i18nGen from "../lib/i18nGen.js";

const main = async (root = process.cwd()) => {
  await i18nGen(root);
  await tran(root);
};

export default main;

if (import.meta.main) {
  await main();
}
