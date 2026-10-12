export default (define_env, minify, plugins) => ({
  transform: {
    define: define_env
  },
  external: (id) => !id.startsWith(".") && !id.startsWith("/"),
  treeshake: {
    moduleSideEffects: true
  },
  output: {
    sourcemap: false,
    minify
  },
  plugins
});
