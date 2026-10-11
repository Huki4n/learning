function wgslPlugin() {
  return {
    name: "wgsl",
    transform(code, id) {
      if (!id.endsWith(".wgsl")) {
        return null;
      }

      return {
        code: `export default ${JSON.stringify(code)};`,
        map: { mappings: "" },
      };
    },
  };
}

export default {
  input: "index.js",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [wgslPlugin()],
};
