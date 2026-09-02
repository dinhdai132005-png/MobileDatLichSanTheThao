module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // SDK 57 / React Native 0.81.5 Hermes hỗ trợ private fields natively
    // Không cần plugin transform nữa
  };
};
