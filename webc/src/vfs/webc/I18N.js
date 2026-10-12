export default (src) => {
  return (
    (src || "") +
    "export default async (code) => (await import(/* @vite-ignore */ `./i18n/${code}.js`)).js;"
  );
};
