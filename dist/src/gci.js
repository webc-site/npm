import { simpleGit } from "simple-git";
import gci from "@3-/gci";

export default async (root) => {
  const git = simpleGit(root),
    { files } = await git.status();

  if (files.length > 0) {
    await gci(undefined, root, "");
  }
};
