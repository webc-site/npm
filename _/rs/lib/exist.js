import urlExist from "@1-/url_exist";

export default async (name, version) =>
  await urlExist("https://registry.npmjs.org/" + name + (version ? "/" + version : ""));
