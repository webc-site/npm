export default (svg) =>
  "data:image/svg+xml," +
  [..."%#<>,'"].reduce((r, c) => r.replaceAll(c, encodeURIComponent(c)), svg.replaceAll('"', "'"));
