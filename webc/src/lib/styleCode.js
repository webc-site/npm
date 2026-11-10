export default (css_content, param = "root") =>
  'const style = newEl("style"); style.innerHTML = ' +
  JSON.stringify(css_content) +
  "; " +
  param +
  ".appendChild(style);";
