import { minify } from "@minify-html/node";

const DECODER = new TextDecoder(),
  ENCODER = new TextEncoder();

export default (html) =>
  DECODER.decode(
    minify(ENCODER.encode(html), {
      keep_closing_tags: true,
      minify_css: true,
      minify_js: true
    })
  ).replaceAll(";</script>", "</script>");
