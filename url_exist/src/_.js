export default async (url, timeout = 3000) => {
  try {
    const { ok } = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeout),
    });
    return ok;
  } catch {}
};
