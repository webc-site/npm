import { optimize } from "svgo";

export default (raw_svg) => {
  const clean_svg = raw_svg.replace(/@import\s+url\([^)]+\);?/g, "");
  return optimize(clean_svg, {
    multipass: true,
    plugins: ["preset-default", "sortAttrs"],
  }).data;
};
