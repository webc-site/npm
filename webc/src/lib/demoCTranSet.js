import injectDefault from "./injectDefault.js";

export default (code) =>
  'import { $ as _i18n$ } from "./I18N.js";\n' +
  injectDefault(
    code,
    (param) =>
      'await (await import("../../../js/c-t.js")).cTranSet(' +
      param +
      ", async (c) => (await _i18n$(c)).pug);"
  );
