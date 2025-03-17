export default {
  expo: {
    name: 'DonationsHub',
    slug: 'donations-hub',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: ['expo-router'],
    scheme: 'donations-hub',
    extra: {
      router: {
        origin: 'https://yahia89.github.io',
        basename: '/donations-hub'
      }
    }
  }
};