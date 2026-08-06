export default async function router(request, env) {
  const url = new URL(request.url);
  switch (url.pathname) {
    case "/":
      return new Response("smtp srv api");
    default:
      return new Response("Not Found", { status: 404 });
  }
}
