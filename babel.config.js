module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['expo-router/babel', {
        origin: 'https://yahia89.github.io',
        basename: '/donations-hub'
      }]
    ]
  };
};