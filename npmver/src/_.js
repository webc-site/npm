export default async (pkg) => {
  const res = await fetch("https://registry.npmjs.org/" + encodeURIComponent(pkg) + "/latest"),
    { status } = res;
  if (status === 200) {
    return (await res.json()).version;
  }
  if (status !== 404) {
    throw new Error(status + " " + (await res.text()));
  }
};
