// Plugin que reemplaza CUALQUIER forma de import.meta con {}
// Cubre: import.meta.url, import.meta.env, import.meta.hot, etc.
function replaceImportMeta() {
  return {
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta.name === 'import' &&
          path.node.property.name === 'meta'
        ) {
          path.replaceWithSourceString('({})');
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [replaceImportMeta],
  };
};
