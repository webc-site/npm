import readme from "./readme.js";
import pushRelease from "../lib/git/pushRelease.js";

export default async (root) => {
  await readme(root);
  await pushRelease(root);
};
