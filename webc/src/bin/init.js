#!/usr/bin/env node
import { readdirSync, cpSync, existsSync, mkdirSync, symlinkSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import ERR from "@3-/log/ERR.js";
import read from "@3-/read";
import write from "@3-/write";
import cacheDir from "../lib/cacheDir.js";
import { parseCli } from "../cli/cli.js";
import cloneOrPull from "../lib/git/cloneOrPull.js";
import { pkgVer } from "../add/fetch.js";
import i18n from "../lib/i18n.js";

const SITE = "webc.site",
  REPO_URL = "https://github.com/webc-site/" + SITE + ".git",
  _ = i18n(import.meta),
  EN = "en",
  SKILLS = "skills",
  DOC = "doc",
  RECURSIVE = { recursive: true },
  FROM_R = /^(\s*from\s*:\s*)\S+/m,
  DIR_SKILLS_R = /^\s*-\s*skills\r?\n?/m,
  symlink = (link_path, target_rel_path) => {
    try {
      unlinkSync(link_path);
    } catch {}
    symlinkSync(target_rel_path, link_path);
  },
  cpRepo = (target_dir, dir, lang) => {
    const target_skills = join(target_dir, SKILLS),
      skill_dir = join(dir, SKILLS);

    for (const name of readdirSync(target_dir)) {
      if (name === ".git") continue;
      if (name === SKILLS) {
        const src_skill = join(target_skills, lang);
        if (existsSync(src_skill)) {
          cpSync(src_skill, join(skill_dir, lang), RECURSIVE);
        }
        continue;
      }
      cpSync(join(target_dir, name), join(dir, name), RECURSIVE);
    }
  },
  tranYmlUp = (dir, lang) => {
    const tran_yml = join(dir, "tran.yml");
    if (existsSync(tran_yml)) {
      write(
        tran_yml,
        read(tran_yml)
          .replace(FROM_R, "$1" + lang)
          .replace(DIR_SKILLS_R, "")
      );
    }
  },
  linkAgents = (dir, lang) => {
    const agents_dir = join(dir, ".agents");
    mkdirSync(agents_dir, RECURSIVE);

    symlink(join(agents_dir, SKILLS), "../" + SKILLS + "/" + lang);

    const doc_lang = existsSync(join(dir, DOC, lang)) ? lang : EN;
    symlink(join(agents_dir, DOC), "../" + DOC + "/" + doc_lang);
  };

export const getArgv = (meta = import.meta) =>
  parseCli(meta, (y) =>
    y
      .usage("usage: $0 [ver]")
      .positional("ver", {
        describe: "version tag",
        type: "string"
      })
      .option("tran.from", {
        default: EN,
        describe: "source language",
        type: "string"
      })
  ).argv;

const initCmd = async (dir = process.cwd(), options = {}) => {
  const file_li = readdirSync(dir).filter((name) => !name.startsWith("."));

  if (file_li.length > 0) {
    ERR(_.notEmpty);
    return 1;
  }

  const ver = options.ver || options._?.[0] || (await pkgVer(SITE)),
    target_dir = cacheDir(SITE);

  await cloneOrPull(REPO_URL, target_dir, ver);

  const tran_from = options.tran?.from || EN,
    target_skills = join(target_dir, SKILLS),
    lang = existsSync(join(target_skills, tran_from)) ? tran_from : EN;

  cpRepo(target_dir, dir, lang);
  tranYmlUp(dir, lang);
  linkAgents(dir, lang);

  return 0;
};

export default initCmd;
if (import.meta.main) {
  const code = await initCmd(process.cwd(), getArgv());
  if (code) process.exit(code);
}
