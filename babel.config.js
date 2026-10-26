module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo ya incluye el plugin de react-native-worklets
    // (Reanimated 4) y el soporte de NativeWind vía jsxImportSource.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
