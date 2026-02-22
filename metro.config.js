const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Forzar resolución CJS en web para evitar import.meta de builds ESM
// (zustand v5 y otros paquetes modernos usan import.meta en su build ESM)
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

module.exports = config;
