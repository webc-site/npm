export default (src, prefix = "i18n", vite_ignore = "/* @vite-ignore */ ") => {
  return (
    (src || "") +
    "export const $=(code)=>import(" +
    vite_ignore +
    "`./" +
    prefix +
    "/${code}.js`);\n" +
    "export default async (code) => (await $(code)).js;\n"
  );
};
