const { expo } = require('./app.json');
module.exports = {
  ...expo,
  userInterfaceStyle: 'light',
  ios: { ...expo.ios, infoPlist: { ...expo.ios.infoPlist, ITSAppUsesNonExemptEncryption: false,
    NSLocationWhenInUseUsageDescription: 'Use your location to choose a pickup and share your position during an active trip.',
  } },
  android: { ...expo.android, ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? { config: { googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } } } : {}) },
};
