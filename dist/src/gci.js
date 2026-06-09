import { simpleGit } from "simple-git";
import gci from "@3-/gci";

const gciCommit = async (root) => {
  const git = simpleGit(root),
    status = await git.status();

  if (status.files.length > 0) {
    await gci(undefined, root, "");
  }
};

export default gciCommit;
