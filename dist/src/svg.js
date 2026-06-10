import renderMdMermaid from "@1-/mdmermaid";
import extName from "@3-/ext";

export default async (readme_content, upload) =>
  renderMdMermaid(
    readme_content,
    async (buf, raw_filename) => "https:" + (await upload(buf, extName(raw_filename))),
  );
