export const repoParse = (repo_url) => {
    let url = typeof repo_url === "string" ? repo_url : repo_url?.url;
    if (!url) return "";
    url = url.replace(/^git\+/, "").replace(/\.git$/, "");
    const match = url.match(/github\.com[/:]([^/]+\/[^/]+)/);
    if (match) return match[1];
    return /^[^/]+\/[^/]+$/.test(url) ? url : "";
  },
  ghPath = (repo, tag, path) => "/gh/" + repo + "@" + tag + "/" + path,
  vTag = (ver) => (ver ? (ver.startsWith("v") ? ver : "v" + ver) : "main");
